import { calculateStats } from '../calculator.js';
import { Conversation } from '../../../providers/types.js';

describe('Stats Calculator', () => {
  it('should return zero stats for empty conversations', () => {
    const stats = calculateStats([]);
    expect(stats.totalConversations).toBe(0);
    expect(stats.totalMessages).toBe(0);
    expect(stats.projects).toEqual([]);
  });

  it('should calculate basic stats correctly', () => {
    const mockConversations: Conversation[] = [
      {
        uuid: '1',
        title: 'Conv 1',
        created_at: new Date(2025, 0, 1),
        updated_at: new Date(2025, 0, 1),
        messages: [
          { uuid: 'm1', sender: 'human', text: 'hi', created_at: new Date() },
          { uuid: 'm2', sender: 'assistant', text: 'hello', created_at: new Date() }
        ],
        tags: ['coding'],
        project_name: 'Project A'
      },
      {
        uuid: '2',
        title: 'Conv 2',
        created_at: new Date(2025, 1, 1),
        updated_at: new Date(2025, 1, 1),
        messages: [
          { uuid: 'm3', sender: 'human', text: 'bye', created_at: new Date() }
        ],
        tags: ['coding', 'life'],
        project_name: 'Project A'
      },
      {
        uuid: '3',
        title: 'Conv 3',
        created_at: new Date(2025, 1, 15),
        updated_at: new Date(2025, 1, 15),
        messages: [],
        tags: [], // No tags
        // No project (undefined)
      }
    ];

    const stats = calculateStats(mockConversations);

    expect(stats.totalConversations).toBe(3);
    expect(stats.totalMessages).toBe(3); // 2 + 1 + 0
    expect(stats.avgMessagesPerConversation).toBe(1); // 3 / 3

    // Projects
    expect(stats.projects).toEqual([
      { label: 'Project A', value: 2 },
      { label: 'Uncategorized', value: 1 }
    ]);

    // Tags
    // coding: 2, life: 1
    expect(stats.topTags).toEqual([
        { label: 'coding', value: 2 },
        { label: 'life', value: 1 }
    ]);

    // Activity
    // 2025-01: 1, 2025-02: 2
    expect(stats.activityByMonth).toEqual([
        { label: '2025-01', value: 1 },
        { label: '2025-02', value: 2 }
    ]);
  });
});
