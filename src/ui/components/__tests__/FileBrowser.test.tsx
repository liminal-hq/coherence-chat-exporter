import React from 'react';
import { render } from 'ink-testing-library';
import { FileBrowser } from '../FileBrowser.js';
import { jest } from '@jest/globals';

// We need to use unstable_mockModule for ESM mocking of 'fs'
// because 'fs' is a built-in module and we are running in ESM mode
// The previous jest.mock calls might not be hoisting correctly or interacting with ESM properly

// Mock fs module
const mockReaddirSync = jest.fn();

// Use unstable_mockModule before importing anything that uses the module
jest.unstable_mockModule('fs', () => ({
    readdirSync: mockReaddirSync,
    default: {
        readdirSync: mockReaddirSync
    }
}));

describe('FileBrowser', () => {
    // We need to dynamic import the component AFTER mocking
    let FileBrowserComponent: any;

    beforeAll(async () => {
        const module = await import('../FileBrowser.js');
        FileBrowserComponent = module.FileBrowser;
    });

    beforeEach(() => {
        mockReaddirSync.mockReset();
    });

    it('renders initial directory', async () => {
        mockReaddirSync.mockReturnValue([
            { name: 'dir1', isDirectory: () => true },
            { name: 'file1.json', isDirectory: () => false }
        ]);

        const { lastFrame, rerender } = render(
            <FileBrowserComponent
                prompt="Select File"
                onSubmit={() => {}}
                onCancel={() => {}}
            />
        );

        // Wait for effect to run? Re-render might be needed if state update is async
        // But readdirSync is sync.
        // Maybe the component uses process.cwd() initial state and effect depends on it?
        // Yes.

        // Let's force a small delay or check immediate render
        // Actually, useEffect runs after render. Ink testing library might need a wait.

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(lastFrame()).toContain('Select File');
        expect(lastFrame()).toContain('dir1');
        expect(lastFrame()).toContain('file1.json');
    });

    it('filters out non-json/zip files', async () => {
        mockReaddirSync.mockReturnValue([
            { name: 'image.png', isDirectory: () => false },
            { name: 'data.json', isDirectory: () => false }
        ]);

        const { lastFrame } = render(
            <FileBrowserComponent
                prompt="Select File"
                onSubmit={() => {}}
                onCancel={() => {}}
            />
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        expect(lastFrame()).toContain('data.json');
        expect(lastFrame()).not.toContain('image.png');
    });
});
