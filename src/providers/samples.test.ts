import { ClaudeProvider } from './claude';
import { ChatGPTProvider } from './chatgpt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const samplesDir = path.resolve(__dirname, '../../samples');

describe('Sample Verification', () => {
    test('Claude mock conversations should parse correctly', async () => {
        const inputPath = path.join(samplesDir, 'claude/mock_conversations.json');
        const rawData = fs.readFileSync(inputPath, 'utf-8');
        const json = JSON.parse(rawData);

        const provider = new ClaudeProvider();
        const conversations = await provider.normalize(json);

        expect(conversations).toHaveLength(2);

        const c1 = conversations.find(c => c.title === 'Designing the Chat Archive Tool');
        expect(c1).toBeDefined();
        expect(c1?.messages).toHaveLength(4);
        expect(c1?.messages[0].text).toContain('I want to build a CLI tool');
        expect(c1?.created_at.toISOString()).toContain('2025-10-27');

        const c2 = conversations.find(c => c.title === 'Weekend Hike Planning');
        expect(c2).toBeDefined();
        expect(c2?.messages).toHaveLength(1);
    });

    test('ChatGPT mock conversations should parse correctly', async () => {
        const inputPath = path.join(samplesDir, 'chatgpt/mock_conversations.json');
        const rawData = fs.readFileSync(inputPath, 'utf-8');
        const json = JSON.parse(rawData);

        const provider = new ChatGPTProvider();
        const conversations = await provider.normalize(json);

        expect(conversations).toHaveLength(2);

        const c1 = conversations.find(c => c.title === 'Designing the Chat Archive Tool');
        expect(c1).toBeDefined();
        expect(c1?.messages).toHaveLength(4);
        expect(c1?.messages[0].text).toContain('I want to build a CLI tool');
        // ChatGPT timestamp is unix seconds, ensure conversion worked
        expect(c1?.created_at.toISOString()).toContain('2025-10-27');

        const c2 = conversations.find(c => c.title === 'Weekend Hike Planning');
        expect(c2).toBeDefined();
        expect(c2?.messages).toHaveLength(1);
    });
});
