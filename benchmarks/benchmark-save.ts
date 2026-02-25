
import { configManager } from '../src/config-manager.js';
import { defaultConfig } from '../src/config.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Setup temp config dir
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'perf-test-'));
process.env.XDG_CONFIG_HOME = tempDir;

console.log('Starting benchmark...');

// Create a large config to make write noticeable
const largeConfig = { ...defaultConfig };
// Add some dummy data to make it larger
(largeConfig as any).dummyData = 'x'.repeat(1024 * 1024 * 5); // 5MB string

const start = performance.now();
// This call is currently synchronous
configManager.saveConfig(largeConfig);
const end = performance.now();

console.log(`saveConfig (blocking time): ${(end - start).toFixed(4)} ms`);

// Cleanup
try {
    fs.rmSync(tempDir, { recursive: true, force: true });
} catch (e) {}
