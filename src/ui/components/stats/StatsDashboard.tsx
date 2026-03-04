import React, { useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { Conversation } from '../../../providers/types.js';
import { calculateStats } from '../../stats/calculator.js';
import { AsciiChart } from './AsciiChart.js';
import { format } from 'date-fns';

interface Props {
  conversations: Conversation[];
  onBack: () => void;
  onChangeSource?: () => void;
}

export const StatsDashboard: React.FC<Props> = ({ conversations, onBack, onChangeSource }) => {
  const stats = useMemo(() => calculateStats(conversations), [conversations]);

  useInput((input, key) => {
    if (key.escape || key.delete || (input === 'b')) {
      onBack();
    }
    if ((input === 'c') && onChangeSource) {
      onChangeSource();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">📊 Stats Dashboard</Text>

      <Box flexDirection="column" marginY={1} borderStyle="round" borderColor="gray" paddingX={1}>
        <Box>
            <Box width="50%">
                <Text>Total Conversations: </Text>
                <Text bold color="green">{stats.totalConversations}</Text>
            </Box>
            <Box width="50%">
                <Text>Total Messages: </Text>
                <Text bold color="green">{stats.totalMessages}</Text>
            </Box>
        </Box>
        <Box>
             <Box width="50%">
                <Text>Avg Msg/Conv: </Text>
                <Text bold color="yellow">{stats.avgMessagesPerConversation}</Text>
            </Box>
            <Box width="50%">
                 <Text>Date Range: </Text>
                 <Text color="gray">
                    {stats.dateRange.start ? format(stats.dateRange.start, 'MMM yyyy') : 'N/A'} - {stats.dateRange.end ? format(stats.dateRange.end, 'MMM yyyy') : 'N/A'}
                 </Text>
            </Box>
        </Box>
      </Box>

      <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
         <Box width="48%">
            <AsciiChart title="🏆 Top Projects" data={stats.projects.slice(0, 5)} maxBarWidth={20} />
         </Box>
         <Box width="48%">
            {stats.topTags.length > 0 && <AsciiChart title="🏷️  Top Tags" data={stats.topTags.slice(0, 5)} maxBarWidth={20} />}
         </Box>
      </Box>

      <AsciiChart title="📈 Activity (Last 12 Months)" data={stats.activityByMonth.slice(-12)} maxBarWidth={60} />

      <Box marginTop={1}>
        <Text color="gray">Press Esc to go back | [c] Change Source</Text>
      </Box>
    </Box>
  );
};
