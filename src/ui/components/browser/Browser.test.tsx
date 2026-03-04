import React from 'react';
import { render } from 'ink-testing-library';
import { Browser } from './Browser.js';
import { Conversation } from '../../../providers/types.js';

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
    messages: [],
    project_name: 'Beta'
  },
  {
    uuid: '3',
    title: 'Random Chat',
    created_at: new Date('2023-01-05'),
    updated_at: new Date('2023-01-06'),
    messages: [],
    // No project
  }
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Browser Component', () => {
  test('renders project list initially', () => {
    const { lastFrame } = render(
      <Browser
        conversations={mockConversations}
        onExport={() => {}}
        onBack={() => {}}
      />
    );

    const frame = lastFrame();
    expect(frame).toContain('Select Project / Group');
    expect(frame).toContain('All Conversations');
    expect(frame).toContain('Project: Alpha');
    expect(frame).toContain('Project: Beta');
  });

  test('navigates to conversation list', async () => {
      const { lastFrame, stdin } = render(
        <Browser
            conversations={mockConversations}
            onExport={() => {}}
            onBack={() => {}}
        />
      );

      // "All Conversations" is first selected. Press Enter.
      stdin.write('\r');
      await delay(100);

      const frame = lastFrame();
      expect(frame).toContain('Browsing: All Conversations');
      expect(frame).toContain('Project Alpha Chat');
      expect(frame).toContain('Project Beta Chat');
      expect(frame).toContain('Random Chat');
  });

  test('filters by project', async () => {
      const { lastFrame, stdin } = render(
        <Browser
            conversations={mockConversations}
            onExport={() => {}}
            onBack={() => {}}
        />
      );

      // Select "Project: Alpha" (down 1)
      stdin.write('\u001B[B'); // Down arrow
      await delay(50);
      stdin.write('\r'); // Enter
      await delay(50);

      const frame = lastFrame();
      expect(frame).toContain('Browsing: Alpha');
      expect(frame).toContain('Project Alpha Chat');
      expect(frame).not.toContain('Project Beta Chat');
  });

  test('opens deep search from project list with slash key', async () => {
      const { lastFrame, stdin } = render(
        <Browser
            conversations={mockConversations}
            onExport={() => {}}
            onBack={() => {}}
        />
      );

      stdin.write('/');
      await delay(100);

      const frame = lastFrame();
      expect(frame).toContain('Deep Content Search');
      expect(frame).toContain('Type to search...');
  });
});
