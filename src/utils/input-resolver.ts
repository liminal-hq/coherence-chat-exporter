import * as fs from 'fs';
import * as path from 'path';
import yauzl from 'yauzl';

export interface ExportData {
  conversations: any; // The parsed JSON content of conversations.json
  projects?: any; // The parsed JSON content of projects.json (optional)
}

export class InputResolver {
  async resolve(inputPath: string): Promise<ExportData> {
    try {
        await fs.promises.access(inputPath);
    } catch {
        throw new Error(`Input path not found: ${inputPath}`);
    }

    const stats = await fs.promises.stat(inputPath);

    if (stats.isDirectory()) {
      return this.resolveDirectory(inputPath);
    } else if (inputPath.toLowerCase().endsWith('.zip')) {
      return this.resolveZip(inputPath);
    } else if (inputPath.toLowerCase().endsWith('.json')) {
      return this.resolveFile(inputPath);
    } else {
      throw new Error('Unsupported input type. Please provide a directory, a .json file, or a .zip file.');
    }
  }

  private async resolveDirectory(dirPath: string): Promise<ExportData> {
    const convPath = path.join(dirPath, 'conversations.json');
    try {
        await fs.promises.access(convPath);
    } catch {
        throw new Error(`conversations.json not found in directory: ${dirPath}`);
    }

    const conversations = await this.readJson(convPath);

    let projects;
    const projPath = path.join(dirPath, 'projects.json');
    try {
        await fs.promises.access(projPath);
        projects = await this.readJson(projPath);
    } catch {
        // projects.json is optional
    }

    return { conversations, projects };
  }

  private async resolveFile(filePath: string): Promise<ExportData> {
    // If user points directly to a JSON file, assume it is conversations.json
    // For Claude, this means projects might be missed unless they are in the same dir
    const conversations = await this.readJson(filePath);

    let projects;
    const dir = path.dirname(filePath);
    const projPath = path.join(dir, 'projects.json');

    // Opportunistically check for projects.json next to the file
    try {
        await fs.promises.access(projPath);
        projects = await this.readJson(projPath);
    } catch {
        // projects.json is optional
    }

    return { conversations, projects };
  }

  private resolveZip(zipPath: string): Promise<ExportData> {
    return new Promise((resolve, reject) => {
        yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
            if (err) {
                return reject(err);
            }
            if (!zipfile) {
                 return reject(new Error('Failed to open zip file'));
            }

            let conversationsData: Buffer | null = null;
            let projectsData: Buffer | null = null;
            let conversationsFound = false;

            // Ensure close happens on error or completion
            const cleanup = () => {
                try {
                    zipfile.close();
                } catch (e) {
                    // ignore if already closed
                }
            };

            zipfile.readEntry();

            zipfile.on('entry', (entry) => {
                if (entry.fileName.endsWith('conversations.json')) {
                    conversationsFound = true;
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            cleanup();
                            return reject(err);
                        }
                        if (!readStream) {
                            cleanup();
                            return reject(new Error('Failed to read stream'));
                        }

                        const chunks: Buffer[] = [];
                        readStream.on('data', (chunk) => chunks.push(chunk));
                        readStream.on('end', () => {
                            conversationsData = Buffer.concat(chunks);
                            zipfile.readEntry();
                        });
                        readStream.on('error', (e) => {
                            cleanup();
                            reject(e);
                        });
                    });
                } else if (entry.fileName.endsWith('projects.json')) {
                    zipfile.openReadStream(entry, (err, readStream) => {
                        if (err) {
                            cleanup();
                            return reject(err);
                        }
                        if (!readStream) {
                            cleanup();
                            return reject(new Error('Failed to read stream'));
                        }

                        const chunks: Buffer[] = [];
                        readStream.on('data', (chunk) => chunks.push(chunk));
                        readStream.on('end', () => {
                            projectsData = Buffer.concat(chunks);
                            zipfile.readEntry();
                        });
                        readStream.on('error', (e) => {
                            cleanup();
                            reject(e);
                        });
                    });
                } else {
                    zipfile.readEntry();
                }
            });

            zipfile.on('end', () => {
                cleanup();
                if (!conversationsFound || !conversationsData) {
                    return reject(new Error('conversations.json not found in zip archive'));
                }

                try {
                    const conversations = JSON.parse(conversationsData.toString('utf8'));
                    let projects;
                    if (projectsData) {
                        projects = JSON.parse(projectsData.toString('utf8'));
                    }
                    resolve({ conversations, projects });
                } catch (e) {
                    reject(e);
                }
            });

            zipfile.on('error', (e) => {
                cleanup();
                reject(e);
            });
        });
    });
  }

  private async readJson(path: string): Promise<any> {
    const content = await fs.promises.readFile(path, 'utf-8');
    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`Failed to parse JSON at ${path}`);
    }
  }
}
