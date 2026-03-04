import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import * as fs from 'fs';
import * as path from 'path';

interface Props {
  prompt: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

interface FileEntry {
  name: string;
  isDirectory: boolean;
}

export const FileBrowser: React.FC<Props> = ({ prompt, onSubmit, onCancel }) => {
    const [currentPath, setCurrentPath] = useState(process.cwd());
    const [entries, setEntries] = useState<FileEntry[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [inputMode, setInputMode] = useState(false);
    const [manualPath, setManualPath] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Load directory contents
    useEffect(() => {
        try {
            const allEntries = fs.readdirSync(currentPath, { withFileTypes: true });

            const filtered = allEntries
                .filter(e => {
                    // Show directories (except hidden ones usually, but maybe show all?)
                    // Let's hide hidden files for cleanliness unless user types it manually
                    if (e.name.startsWith('.')) return false;

                    if (e.isDirectory()) return true;
                    // Show relevant files
                    return e.name.endsWith('.json') || e.name.endsWith('.zip');
                })
                .map(e => ({
                    name: e.name,
                    isDirectory: e.isDirectory()
                }))
                .sort((a, b) => {
                    // Directories first
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                });

            // Add ".." entry if not at root?
            // Actually, usually helpful to have ".." at the top
            const finalEntries = [{ name: '..', isDirectory: true }, ...filtered];

            setEntries(finalEntries);
            setSelectedIndex(0);
            setError(null);
        } catch (e: any) {
            setError(e.message);
            setEntries([{ name: '..', isDirectory: true }]);
        }
    }, [currentPath]);

    useInput((input, key) => {
        if (inputMode) {
             // Let TextInput handle it, but we might need to trap Escape to exit input mode
             if (key.escape) {
                 setInputMode(false);
                 setManualPath(''); // Reset or keep? Let's reset to avoid confusion
             }
             return;
        }

        if (key.upArrow || input === 'k') {
            setSelectedIndex(prev => Math.max(0, prev - 1));
        }
        if (key.downArrow || input === 'j') {
            setSelectedIndex(prev => Math.min(entries.length - 1, prev + 1));
        }
        if (key.leftArrow || key.backspace) {
            // Go up a directory
            const parent = path.dirname(currentPath);
            if (parent !== currentPath) {
                setCurrentPath(parent);
            }
        }
        if (key.return || key.rightArrow) {
             const selected = entries[selectedIndex];
             if (!selected) return;

             if (selected.name === '..') {
                 const parent = path.dirname(currentPath);
                 setCurrentPath(parent);
             } else if (selected.isDirectory) {
                 setCurrentPath(path.join(currentPath, selected.name));
             } else {
                 // It's a file, select it
                 onSubmit(path.join(currentPath, selected.name));
             }
        }
        if (key.tab) {
            setInputMode(true);
            setManualPath(currentPath);
        }

        // Allow 'q' or Esc to cancel/back
        if (input === 'q' || key.escape) {
            onCancel();
        }
    });

    if (inputMode) {
        return (
            <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
                <Text color="cyan" bold>{prompt}</Text>
                <Box marginTop={1}>
                    <Text>Path: </Text>
                    <TextInput
                        value={manualPath}
                        onChange={setManualPath}
                        onSubmit={onSubmit}
                    />
                </Box>
                <Text color="gray">
                    Enter: Confirm | Esc: Back to Browser
                </Text>
            </Box>
        );
    }

    // Calculate window for scrolling if list is long
    // Simple slice for now, assuming typical terminal height.
    // Ideally we'd measure height, but let's just show a fixed window of ~10 items around selection
    const WINDOW_SIZE = 10;
    const startIdx = Math.max(0, Math.min(selectedIndex - Math.floor(WINDOW_SIZE / 2), entries.length - WINDOW_SIZE));
    const endIdx = Math.min(startIdx + WINDOW_SIZE, entries.length);
    const visibleEntries = entries.slice(startIdx, endIdx);

    return (
        <Box flexDirection="column" padding={1} borderStyle="round" borderColor="cyan">
            <Text color="cyan" bold>{prompt}</Text>
            <Text color="gray">Current: {currentPath}</Text>

            {error && <Text color="red">Error: {error}</Text>}

            <Box flexDirection="column" marginTop={1} marginBottom={1}>
                {visibleEntries.map((entry, idx) => {
                    const actualIdx = startIdx + idx;
                    const isSelected = actualIdx === selectedIndex;
                    const icon = entry.isDirectory ? '📁' : '📄';

                    return (
                        <Box key={`${entry.name}-${idx}`}>
                            <Text color={isSelected ? "green" : "white"}>
                                {isSelected ? "> " : "  "}
                                {icon} {entry.name}
                            </Text>
                        </Box>
                    );
                })}
            </Box>

            <Box borderStyle="single" borderColor="gray" paddingX={1}>
                <Text color="gray">
                    ↑/k, ↓/j: Navigate | ←/Back: Up Dir | →/Enter: Select/Open | Tab: Manual Input | Esc/q: Back
                </Text>
            </Box>
        </Box>
    );
};
