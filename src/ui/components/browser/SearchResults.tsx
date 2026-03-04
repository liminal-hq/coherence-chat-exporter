import React, { useState, useMemo, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import { Conversation } from '../../../providers/types.js';

interface SearchResultsProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  onBack: () => void;
}

interface SearchMatch {
    conversation: Conversation;
    previewText: string;
    matchCount: number;
}

// Helper to escape regex special characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const SearchResults: React.FC<SearchResultsProps> = ({ conversations, onSelectConversation, onBack }) => {
  const { stdout } = useStdout();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(true); // Start with focus on search input
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

  const itemsPerPage = Math.max(5, terminalRows - 13);

  // Perform search
  const results = useMemo(() => {
      if (!query || query.length < 2) return [];

      const lowerQuery = query.toLowerCase();
      const matches: SearchMatch[] = [];

      conversations.forEach(conv => {
          let count = 0;
          let firstMatchText = '';

          // Check title
          if (conv.title.toLowerCase().includes(lowerQuery)) {
              count++;
              firstMatchText = `Title: ${conv.title}`;
          }

          // Check messages
          conv.messages.forEach(msg => {
              const idx = msg.text.toLowerCase().indexOf(lowerQuery);
              if (idx !== -1) {
                  count++;
                  if (!firstMatchText) {
                      // Extract snippet
                      const start = Math.max(0, idx - 20);
                      const end = Math.min(msg.text.length, idx + 50);
                      firstMatchText = `...${msg.text.substring(start, end).replace(/\n/g, ' ')}...`;
                  }
              }
          });

          if (count > 0) {
              matches.push({
                  conversation: conv,
                  previewText: firstMatchText,
                  matchCount: count
              });
          }
      });

      return matches;
  }, [conversations, query]);

  const totalPages = Math.ceil(results.length / itemsPerPage);

  useEffect(() => {
    setPage(0);
    setSelectedIndex(0);
  }, [query]);

  const currentItems = useMemo(() => {
    const start = page * itemsPerPage;
    return results.slice(start, start + itemsPerPage);
  }, [results, page, itemsPerPage]);

  useInput((input, key) => {
    if (isSearching) {
        if (key.return) {
            setIsSearching(false); // Stop typing, start navigating
        }
        if (key.escape) {
            onBack();
        }
        return;
    }

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
      if (currentItems[selectedIndex]) {
        onSelectConversation(currentItems[selectedIndex].conversation);
      }
    }
    if (input === '/' || input === 's') {
        setIsSearching(true);
    }
    if (key.escape || key.backspace) {
        if (query) {
             // If navigating results, backspace goes back to search input
             setIsSearching(true);
        } else {
             onBack();
        }
    }
  });

  // Render highlighted snippet
  const renderSnippet = (text: string, isHovered: boolean) => {
      if (!query) return <Text wrap="truncate-end" color="gray">{text}</Text>;

      const escapedQuery = escapeRegExp(query);
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

      return (
          <Text wrap="truncate-end">
              {parts.map((part, i) => {
                  const isMatch = part.toLowerCase() === query.toLowerCase();
                  if (isMatch) {
                      return <Text key={i} color="black" backgroundColor={isHovered ? "green" : "yellow"}>{part}</Text>;
                  }
                  return <Text key={i} color="gray">{part}</Text>;
              })}
          </Text>
      );
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" padding={1} width="100%">
        <Box marginBottom={1}>
            <Text bold color="yellow">Deep Content Search</Text>
        </Box>
        <Box marginBottom={1}>
            <Text>Search: </Text>
            <TextInput
                value={query}
                onChange={setQuery}
                focus={isSearching}
                placeholder="Type keywords..."
            />
        </Box>

        <Box borderStyle="single" borderColor="gray" marginBottom={0}>
             <Box width={30}><Text bold>Title</Text></Box>
             <Box width={40}><Text bold>First Match</Text></Box>
             <Box width={10}><Text bold>Hits</Text></Box>
        </Box>

        {currentItems.length > 0 ? currentItems.map((item, idx) => {
            const isHovered = idx === selectedIndex && !isSearching;
            return (
                <Box key={item.conversation.uuid}>
                    <Text color={isHovered ? 'yellow' : 'white'}>{isHovered ? '> ' : '  '}</Text>
                    <Box width={30}>
                        <Text wrap="truncate-end" color={isHovered ? 'yellow' : 'white'}>
                            {item.conversation.title.substring(0, 28)}
                        </Text>
                    </Box>
                    <Box width={40}>
                        {renderSnippet(item.previewText, isHovered)}
                    </Box>
                    <Box width={10}>
                         <Text>{item.matchCount}</Text>
                    </Box>
                </Box>
            );
        }) : (
            <Box padding={1}>
                <Text italic color="gray">{query.length > 1 ? 'No results found.' : 'Type to search...'}</Text>
            </Box>
        )}

        <Box marginTop={1} borderStyle="single" borderColor="gray">
             <Text>
                 <Text bold color="green">Enter</Text>: {isSearching ? 'Navigate Results' : 'Open Conversation'} |
                 <Text bold color="green"> /</Text>: Edit Search |
                 <Text bold color="green"> Esc</Text>: Back
             </Text>
        </Box>
    </Box>
  );
};
