import { calculateStats } from '../src/ui/stats/calculator.js';
import { Conversation } from '../src/providers/types.js';

// Helper to generate random date within range
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper to generate mock conversations
const generateConversations = (count: number): Conversation[] => {
  const conversations: Conversation[] = [];
  const projects = ['Project A', 'Project B', 'Project C', undefined];
  const tagsList = [['coding'], ['misc', 'life'], [], undefined];

  const startDate = new Date('2020-01-01');
  const endDate = new Date('2025-01-01');

  for (let i = 0; i < count; i++) {
    const created = randomDate(startDate, endDate);
    conversations.push({
      uuid: `uuid-${i}`,
      title: `Conversation ${i}`,
      created_at: created,
      updated_at: created,
      messages: new Array(Math.floor(Math.random() * 20)).fill(null).map((_, idx) => ({
        uuid: `msg-${i}-${idx}`,
        sender: Math.random() > 0.5 ? 'human' : 'assistant',
        text: 'some text',
        created_at: created
      })),
      tags: tagsList[Math.floor(Math.random() * tagsList.length)],
      project_name: projects[Math.floor(Math.random() * projects.length)]
    });
  }
  return conversations;
};

const runBenchmark = () => {
  const count = 100000;
  console.log(`Generating ${count} conversations...`);
  const conversations = generateConversations(count);

  console.log('Running calculateStats...');

  // Warmup
  calculateStats(conversations.slice(0, 100));

  const start = performance.now();
  const stats = calculateStats(conversations);
  const end = performance.now();

  console.log(`Time taken: ${(end - start).toFixed(4)} ms`);
  console.log(`Total Messages: ${stats.totalMessages}`);
};

runBenchmark();
