
import { ExportPipeline } from '../src/export/pipeline.js';
import { MarkdownTransformer } from '../src/export/transformer.js';
import { Organizer } from '../src/export/organizer.js';
import { Writer } from '../src/export/writer.js';
import { Conversation } from '../src/providers/types.js';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

// Mock Provider
const mockProvider = {
    name: 'benchmark',
    normalize: async (data: any) => data
};

// Generate Dummy Data
function generateConversations(count: number): Conversation[] {
    const convs: Conversation[] = [];
    for (let i = 0; i < count; i++) {
        convs.push({
            uuid: `uuid-${i}`,
            title: `Benchmark Conversation ${i}`,
            created_at: new Date(),
            updated_at: new Date(),
            messages: [
                {
                    uuid: `msg-${i}-1`,
                    sender: 'human',
                    text: 'Hello, world!',
                    created_at: new Date()
                },
                {
                    uuid: `msg-${i}-2`,
                    sender: 'assistant',
                    text: 'Hello! How can I help you today? ' + 'Content '.repeat(100), // Some content
                    created_at: new Date()
                }
            ],
            tags: []
        });
    }
    return convs;
}

async function runBenchmark() {
    console.log('Setup benchmark...');
    // Cleanup
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const transformer = new MarkdownTransformer();
    const organizer = new Organizer(OUTPUT_DIR);
    const writer = new Writer();
    const pipeline = new ExportPipeline(mockProvider, transformer, organizer, writer);

    const COUNT = 1000;
    const conversations = generateConversations(COUNT);

    console.log(`Starting export of ${COUNT} conversations...`);
    const start = performance.now();

    await pipeline.export(conversations, { enableTagging: false, tagThreshold: 0 });

    const end = performance.now();
    const duration = end - start;

    console.log(`Export completed in ${duration.toFixed(2)}ms`);
    console.log(`Average: ${(duration / COUNT).toFixed(2)}ms per conversation`);

    // Cleanup
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}

runBenchmark().catch(console.error);
