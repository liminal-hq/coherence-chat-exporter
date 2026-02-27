import React from 'react';
import { render } from 'ink-testing-library';
import { PathInput } from '../PathInput.js';
import { jest } from '@jest/globals';

describe('PathInput', () => {
  test('renders prompt correctly', () => {
    const { lastFrame } = render(
      <PathInput
        prompt="Enter path:"
        onSubmit={() => {}}
        onCancel={() => {}}
      />
    );

    const frame = lastFrame();
    expect(frame).toContain('Enter path:');
    expect(frame).toContain('➜');
  });

  test('calls onCancel when Escape is pressed', async () => {
      const onCancel = jest.fn();
      const { stdin } = render(
        <PathInput
            prompt="Enter path:"
            onSubmit={() => {}}
            onCancel={onCancel}
        />
      );

      // Press Escape
      stdin.write('\x1B'); // ESC key code
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onCancel).toHaveBeenCalled();
  });
});
