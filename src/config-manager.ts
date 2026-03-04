import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Config, defaultConfig } from './config.js';

export class ConfigManager {
  private configPath: string;
  private currentConfig: Config;
  private savePromise: Promise<void> = Promise.resolve();

  constructor() {
    this.configPath = this.getConfigPath();
    this.currentConfig = { ...defaultConfig };
  }

  private getConfigPath(): string {
    const xdgConfigHome = process.env.XDG_CONFIG_HOME;
    const baseDir = xdgConfigHome || path.join(os.homedir(), '.config');
    const configDir = path.join(baseDir, 'chat-archive');

    if (!fs.existsSync(configDir)) {
      try {
        fs.mkdirSync(configDir, { recursive: true });
      } catch {
        // Fallback to local directory if permission denied (e.g. in sandbox)
        return path.join(process.cwd(), '.chat-archive-config.json');
      }
    }

    return path.join(configDir, 'config.json');
  }

  public loadConfig(): Config {
    if (fs.existsSync(this.configPath)) {
      try {
        const fileContent = fs.readFileSync(this.configPath, 'utf-8');
        const savedConfig = JSON.parse(fileContent);
        // Deep merge logic could go here, but for now simple spread with defaults as base
        // Note: This only does shallow merge of top-level keys.
        // A robust solution would do deep merge.

        // Manual deep merge for known nested objects:
        this.currentConfig = {
            ...defaultConfig,
            ...savedConfig,
            providers: { ...defaultConfig.providers, ...(savedConfig.providers || {}) },
            tagging: { ...defaultConfig.tagging, ...(savedConfig.tagging || {}) },
            formatting: { ...defaultConfig.formatting, ...(savedConfig.formatting || {}) }
        };
      } catch (e) {
        console.warn('Failed to parse config file, using defaults.', e);
      }
    }
    return this.currentConfig;
  }

  public async saveConfig(newConfig: Config): Promise<void> {
    this.currentConfig = newConfig;

    // Serialize writes to prevent race conditions
    this.savePromise = this.savePromise.then(async () => {
      try {
        await fs.promises.writeFile(this.configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
      } catch (e) {
        console.error('Failed to save config:', e);
      }
    });

    return this.savePromise;
  }

  public getConfig(): Config {
    return this.currentConfig;
  }
}

export const configManager = new ConfigManager();
