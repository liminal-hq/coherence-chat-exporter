import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  prompt: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export const PathInput: React.FC<Props> = ({ prompt, onSubmit, onCancel }) => {
    const [path, setPath] = useState('');

    useInput((input, key) => {
        if (key.escape) {
            onCancel();
        }
    });

    return (
        <Box flexDirection="column" padding={1}>
            <Text>{prompt}</Text>
            <Box>
                <Text color="green">➜ </Text>
                <TextInput value={path} onChange={setPath} onSubmit={onSubmit} />
            </Box>
            <Text color="gray">(Press Enter to confirm, Esc to back)</Text>
        </Box>
    );
};
