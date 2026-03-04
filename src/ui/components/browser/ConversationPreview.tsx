import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';
import TextInput from 'ink-text-input';
import { Conversation } from '../../../providers/types.js';

interface ConversationPreviewProps {
  conversation: Conversation;
  onBack: () => void;
}

// Helper to escape regex special characters
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const ConversationPreview: React.FC<ConversationPreviewProps> = ({ conversation, onBack }) => {
  const { stdout } = useStdout();
  const [scrollOffset, setScrollOffset] = useState(0);
  const [dims, setDims] = useState({
    rows: stdout?.rows || 24,
    columns: stdout?.columns || 80
  });

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [matchedLines, setMatchedLines] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  useEffect(() => {
    if (!stdout) return;
    const onResize = () => setDims({ rows: stdout.rows, columns: stdout.columns });
    stdout.on('resize', onResize);
    return () => {
      stdout.off('resize', onResize);
    };
  }, [stdout]);

  // Header (~5) + Footer (~3) + Padding (~2) = ~10 overhead
  // Plus Global Layout Border (~2) = ~12 overhead
  const viewHeight = Math.max(5, dims.rows - 12);
  const maxWidth = Math.max(20, dims.columns - 6); // Border/Padding safety

  // Simple flatten of messages to lines for scrolling with wrapping
  const lines = useMemo(() => {
    const allLines: string[] = [];
    conversation.messages.forEach(msg => {
       const role = msg.sender.toUpperCase();
       const date = msg.created_at ? new Date(msg.created_at).toLocaleString() : '';
       allLines.push(`--- ${role} (${date}) ---`);

       msg.text.split('\n').forEach(line => {
           if (line.length <= maxWidth) {
               allLines.push(line);
           } else {
               // Wrap long lines
               const chunks = line.match(new RegExp(`.{1,${maxWidth}}`, 'g')) || [line];
               chunks.forEach(c => allLines.push(c));
           }
       });
       allLines.push(''); // Empty line between messages
    });
    return allLines;
  }, [conversation, maxWidth]);

  // Perform search when query is "submitted" (Enter)
  const executeSearch = () => {
      if (!searchQuery) {
          setMatchedLines([]);
          setCurrentMatchIndex(-1);
          setIsSearching(false);
          return;
      }
      const matches: number[] = [];
      const lowerQuery = searchQuery.toLowerCase();

      lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(lowerQuery)) {
              matches.push(idx);
          }
      });

      setMatchedLines(matches);
      if (matches.length > 0) {
          setCurrentMatchIndex(0);
          // Jump to first match, centering it if possible
          const matchLine = matches[0];
          setScrollOffset(Math.max(0, Math.min(matchLine - Math.floor(viewHeight / 2), lines.length - viewHeight)));
      } else {
          setCurrentMatchIndex(-1);
      }
      setIsSearching(false);
  };

  const jumpToMatch = (index: number) => {
      if (index < 0 || index >= matchedLines.length) return;
      setCurrentMatchIndex(index);
      const matchLine = matchedLines[index];
      // Try to center the match
      const targetOffset = matchLine - Math.floor(viewHeight / 2);
      setScrollOffset(Math.max(0, Math.min(targetOffset, lines.length - viewHeight)));
  };

  useInput((input, key) => {
    if (isSearching) {
        if (key.return) {
            executeSearch();
        }
        if (key.escape) {
            setIsSearching(false);
            setSearchQuery(''); // Clear search on escape
        }
        return;
    }

    // Vim-like navigation
    if (key.upArrow) {
      setScrollOffset(prev => Math.max(0, prev - 1));
    }
    if (key.downArrow) {
      setScrollOffset(prev => Math.min(Math.max(0, lines.length - viewHeight), prev + 1));
    }

    // Page Up/Down could be mapped too, but sticking to basics
    if (input === 'g') {
        setScrollOffset(0);
    }
    if (input === 'G') {
        setScrollOffset(Math.max(0, lines.length - viewHeight));
    }

    if (input === '/') {
        setIsSearching(true);
        // Don't clear query immediately so they can edit it
    }

    if (input === 'n') {
        if (matchedLines.length > 0) {
            const next = (currentMatchIndex + 1) % matchedLines.length;
            jumpToMatch(next);
        }
    }
    if (input === 'N') {
        if (matchedLines.length > 0) {
            const prev = (currentMatchIndex - 1 + matchedLines.length) % matchedLines.length;
            jumpToMatch(prev);
        }
    }

    if (key.escape || key.backspace || key.delete) {
      onBack();
    }
  });

  const visibleLines = lines.slice(scrollOffset, scrollOffset + viewHeight);

  // Helper to highlight text
  const renderLine = (text: string, lineIndex: number) => {
      // Check if this line is the current match
      const isCurrentMatchLine = matchedLines[currentMatchIndex] === lineIndex;

      if (!searchQuery || matchedLines.indexOf(lineIndex) === -1) {
           return <Text wrap="truncate-end">{text}</Text>;
      }

      // Highlight logic with escaped query
      const escapedQuery = escapeRegExp(searchQuery);
      const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
      return (
          <Text wrap="truncate-end">
              {parts.map((part, i) => {
                  const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
                  if (isMatch) {
                      return <Text key={i} color="black" backgroundColor={isCurrentMatchLine ? "green" : "yellow"}>{part}</Text>;
                  }
                  return <Text key={i}>{part}</Text>;
              })}
          </Text>
      );
  };

  return (
    <Box flexDirection="column" padding={1} width="100%">
      <Box marginBottom={1} borderStyle="single" borderColor="gray" justifyContent="space-between">
          <Text bold wrap="truncate-end">{conversation.title}</Text>
          <Text>{matchedLines.length > 0 ? `Match ${currentMatchIndex + 1}/${matchedLines.length}` : ''}</Text>
      </Box>

      <Box flexDirection="column" height={viewHeight}>
        {visibleLines.map((line, idx) => (
          <Box key={idx}>
              {renderLine(line, scrollOffset + idx)}
          </Box>
        ))}
        {lines.length === 0 && <Text italic>No messages to display.</Text>}
      </Box>

      {isSearching ? (
          <Box marginTop={1} borderStyle="single" borderColor="cyan">
              <Text color="cyan">Search: </Text>
              <TextInput value={searchQuery} onChange={setSearchQuery} focus={isSearching} onSubmit={executeSearch} />
          </Box>
      ) : (
          <Box marginTop={1} borderStyle="single" borderColor="gray">
              <Text>
                  <Text bold color="green">Arrows/g/G</Text>: Scroll |
                  <Text bold color="green"> /</Text>: Search |
                  <Text bold color="green"> n/N</Text>: Next/Prev Match |
                  <Text bold color="green"> Esc</Text>: Back
              </Text>
          </Box>
      )}
    </Box>
  );
};
