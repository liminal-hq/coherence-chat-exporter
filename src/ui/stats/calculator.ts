import { Conversation } from '../../providers/types.js';
import { format, isValid } from 'date-fns';

export interface StatItem {
  label: string;
  value: number;
}

export interface ConversationStats {
  totalConversations: number;
  totalMessages: number;
  avgMessagesPerConversation: number;
  dateRange: { start: Date | null; end: Date | null };
  projects: StatItem[];
  activityByMonth: StatItem[];
  topTags: StatItem[];
}

export const calculateStats = (conversations: Conversation[]): ConversationStats => {
  const stats: ConversationStats = {
    totalConversations: 0,
    totalMessages: 0,
    avgMessagesPerConversation: 0,
    dateRange: { start: null, end: null },
    projects: [],
    activityByMonth: [],
    topTags: []
  };

  if (!conversations || conversations.length === 0) {
    return stats;
  }

  stats.totalConversations = conversations.length;

  const projectCounts: Record<string, number> = {};
  const monthCounts: Record<string, number> = {};
  const tagCounts: Record<string, number> = {};

  let minTime: number | null = null;
  let maxTime: number | null = null;

  conversations.forEach(conv => {
    // Messages
    stats.totalMessages += conv.messages.length;

    // Date
    if (conv.created_at && isValid(conv.created_at)) {
      const time = conv.created_at.getTime();

      if (minTime === null || time < minTime) {
        minTime = time;
      }
      if (maxTime === null || time > maxTime) {
        maxTime = time;
      }

      const monthKey = format(conv.created_at, 'yyyy-MM');
      monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
    }

    // Project
    const project = conv.project_name || 'Uncategorized';
    projectCounts[project] = (projectCounts[project] || 0) + 1;

    // Tags
    if (conv.tags) {
      conv.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  // Average
  stats.avgMessagesPerConversation = Math.round((stats.totalMessages / stats.totalConversations) * 10) / 10;

  // Date Range
  if (minTime !== null && maxTime !== null) {
    stats.dateRange.start = new Date(minTime);
    stats.dateRange.end = new Date(maxTime);
  }

  // Helper to sort and map map to StatItem
  const toSortedStats = (map: Record<string, number>, limit?: number): StatItem[] => {
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  };

  stats.projects = toSortedStats(projectCounts, 10);
  stats.topTags = toSortedStats(tagCounts, 10);

  // Activity by month - sort chronologically, not by value
  stats.activityByMonth = Object.entries(monthCounts)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return stats;
};
