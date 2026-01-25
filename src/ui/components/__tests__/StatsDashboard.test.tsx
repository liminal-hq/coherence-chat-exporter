import React from 'react';
import { render } from 'ink-testing-library';
import { StatsDashboard } from '../stats/StatsDashboard.js';
import { Conversation } from '../../../providers/types.js';
import { jest } from '@jest/globals';

const mockConversations: Conversation[] = [
  {
    uuid: '1',
    title: 'Project Alpha Chat',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-01-02'),
    messages: [
        { uuid: 'm1', sender: 'human', text: 'Hello', created_at: new Date() },
        { uuid: 'm2', sender: 'assistant', text: 'Hi there', created_at: new Date() }
    ],
    project_name: 'Alpha'
  },
  {
    uuid: '2',
    title: 'Project Beta Chat',
    created_at: new Date('2023-01-03'),
    updated_at: new Date('2023-01-04'),
    messages: [
         { uuid: 'm3', sender: 'human', text: 'Test', created_at: new Date() }
    ],
    project_name: 'Beta'
  }
];

describe('StatsDashboard', () => {
  test('renders stats summary', () => {
    const { lastFrame } = render(
      <StatsDashboard
        conversations={mockConversations}
        onBack={() => {}}
      />
    );

    const frame = lastFrame();
    expect(frame).toContain('Stats Dashboard');
    expect(frame).toContain('Total Conversations:');
    expect(frame).toContain('2'); // Total conversations
    expect(frame).toContain('Total Messages:');
    expect(frame).toContain('3'); // Total messages (2+1)

    // Check for project names in the chart
    expect(frame).toContain('Top Projects');
    expect(frame).toContain('Alpha');
    expect(frame).toContain('Beta');
  });

  test('handles back navigation', async () => {
      const onBack = jest.fn();
      const { stdin } = render(
        <StatsDashboard
            conversations={mockConversations}
            onBack={onBack}
        />
      );

      // Press 'b' to go back
      stdin.write('b');
      // Wait a bit for effect
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onBack).toHaveBeenCalled();
  });
});
