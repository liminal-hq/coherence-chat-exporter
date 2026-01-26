
import { InputResolver } from './input-resolver.js';
import AdmZip from 'adm-zip';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('InputResolver', () => {
    const tempDir = path.join(__dirname, 'temp_test');
    const zipPath = path.join(tempDir, 'test.zip');

    beforeAll(() => {
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
    });

    afterAll(() => {
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it('resolves a zip file correctly', async () => {
        const conversations = [{ uuid: '1', name: 'Test' }];
        const projects = [{ uuid: 'p1', name: 'Project' }];

        const zip = new AdmZip();
        zip.addFile('conversations.json', Buffer.from(JSON.stringify(conversations)));
        zip.addFile('projects.json', Buffer.from(JSON.stringify(projects)));
        zip.writeZip(zipPath);

        const resolver = new InputResolver();
        const data = await resolver.resolve(zipPath);

        expect(data.conversations).toHaveLength(1);
        expect(data.conversations[0].name).toBe('Test');
        expect(data.projects).toHaveLength(1);
        expect(data.projects[0].name).toBe('Project');
    });

    it('throws if conversations.json is missing in zip', async () => {
        const zip = new AdmZip();
        zip.addFile('dummy.txt', Buffer.from('hello'));
        zip.writeZip(zipPath);

        const resolver = new InputResolver();
        await expect(resolver.resolve(zipPath)).rejects.toThrow('conversations.json not found');
    });

    it('handles projects.json being optional', async () => {
        const conversations = [{ uuid: '1', name: 'Test' }];

        const zip = new AdmZip();
        zip.addFile('conversations.json', Buffer.from(JSON.stringify(conversations)));
        zip.writeZip(zipPath);

        const resolver = new InputResolver();
        const data = await resolver.resolve(zipPath);

        expect(data.conversations).toHaveLength(1);
        expect(data.projects).toBeUndefined();
    });
});
