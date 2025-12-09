import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import { Conversation } from '../../../providers/types.js';

interface ConversationListProps {
  conversations: Conversation[];
  projectName: string | null;
  onSelectConversation: (conversation: Conversation) => void;
  onSelectionChange: (selectedUuids: string[]) => void;
  selectedUuids: string[];
  onBack: () => void;
  onExport: () => void;
  onViewStats?: () => void;
  onChangeSource?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  projectName,
  onSelectConversation,
  onSelectionChange,
  selectedUuids,
  onBack,
  onExport,
  onViewStats,
  onChangeSource
}) => {
  const { stdout } = useStdout();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [terminalRows, setTerminalRows] = useState(stdout?.rows || 24);

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => setTerminalRows(stdout.rows);
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  // Dynamic calculation of items per page based on terminal height
  // Header (~5 lines) + Footer (~3 lines) + Padding (~2 lines) = ~10 lines overhead
  const itemsPerPage = Math.max(5, terminalRows - 12);

  // Filter conversations by project
  const filteredConversations = useMemo(() => {
    if (!projectName) return conversations;
    return conversations.filter(c => c.project_name === projectName);
  }, [conversations, projectName]);

  const totalPages = Math.ceil(filteredConversations.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const start = page * itemsPerPage;
    return filteredConversations.slice(start, start + itemsPerPage);
  }, [filteredConversations, page, itemsPerPage]);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(prev => Math.min(currentItems.length - 1, prev + 1));
    }
    if (key.leftArrow) {
      if (page > 0) {
        setPage(p => p - 1);
        setSelectedIndex(0);
      }
    }
    if (key.rightArrow) {
      if (page < totalPages - 1) {
        setPage(p => p + 1);
        setSelectedIndex(0);
      }
    }
    if (key.return) {
      // Open preview
      onSelectConversation(currentItems[selectedIndex]);
    }
    if (input === ' ') {
      // Toggle selection
      const item = currentItems[selectedIndex];
      const newSelected = selectedUuids.includes(item.uuid)
        ? selectedUuids.filter(id => id !== item.uuid)
        : [...selectedUuids, item.uuid];
      onSelectionChange(newSelected);
    }
    if (input === 'e') {
        onExport();
    }
    if (input === 's' && onViewStats) {
        onViewStats();
    }
    if ((input === 'c') && onChangeSource) {
        onChangeSource();
    }
    if (key.escape || key.backspace || key.delete) {
        onBack();
    }
  });

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box justifyContent="space-between" marginBottom={1}>
        <Text bold>
           Browsing: {projectName || 'All Conversations'}
           ({filteredConversations.length} total)
        </Text>
        <Text>Page {page + 1}/{totalPages || 1}</Text>
      </Box>

      {/* Header */}
      <Box borderStyle="single" borderColor="gray" marginBottom={0}>
        <Box width={3}><Text> </Text></Box>
        <Box width={40}><Text bold>Title</Text></Box>
        <Box width={15}><Text bold>Date</Text></Box>
        <Box width={10}><Text bold>Msgs</Text></Box>
      </Box>

      {/* List */}
      {currentItems.map((conv, idx) => {
        const isSelected = selectedUuids.includes(conv.uuid);
        const isHovered = idx === selectedIndex;
        const dateStr = conv.created_at ? new Date(conv.created_at).toISOString().split('T')[0] : 'N/A';

        return (
          <Box key={conv.uuid}>
             <Text color={isHovered ? 'cyan' : 'white'}>{isHovered ? '> ' : '  '}</Text>
             <Text color={isSelected ? 'green' : 'gray'}>{isSelected ? '[x] ' : '[ ] '}</Text>
             <Box width={40}>
                <Text wrap="truncate-end" color={isHovered ? 'cyan' : 'white'}>
                  {conv.title.substring(0, 38)}
                </Text>
             </Box>
             <Box width={15}>
                 <Text color="gray">{dateStr}</Text>
             </Box>
             <Box width={10}>
                 <Text color="gray">{conv.messages.length}</Text>
             </Box>
          </Box>
        );
      })}

      <Box marginTop={1} borderStyle="single" borderColor="gray" flexDirection="column">
         <Text>
            <Text bold color="green">Space</Text>: Select
            <Text bold color="green"> Enter</Text>: Preview
            <Text bold color="green"> Arrows</Text>: Navigate/Page
            <Text bold color="yellow"> 'e'</Text>: Export Selected ({selectedUuids.length})
            <Text bold color="cyan"> 's'</Text>: Stats
            <Text bold color="cyan"> 'c'</Text>: Change Source
         </Text>
      </Box>
    </Box>
  );
};
