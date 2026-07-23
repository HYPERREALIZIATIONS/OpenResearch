import React from 'react';
import { Box, Text } from 'ink';
import { CanvasItem, SearchResult } from '../types';

interface Props {
  items: CanvasItem[];
  searchResults: SearchResult[];
  status: string;
}

const CanvasPanel: React.FC<Props> = ({ items, searchResults, status }) => {
  const typeIcons: Record<string, string> = {
    note: '📝',
    task: '✅',
    plan: '📋',
    finding: '🔍',
    verdict: '⚖️',
  };

  const typeColors: Record<string, string> = {
    note: 'white',
    task: 'green',
    plan: 'cyan',
    finding: 'blue',
    verdict: 'magenta',
  };

  return (
    <Box flexDirection="column" flexGrow={1} paddingX={1}>
      <Box marginBottom={1}>
        <Text color="gray">Status: {status}</Text>
      </Box>
      {items.length === 0 && searchResults.length === 0 && (
        <Box>
          <Text color="gray" dimColor>
            Canvas will populate with research findings, plans, and verdicts here.
          </Text>
        </Box>
      )}
      {items.map(item => (
        <Box key={item.id} marginBottom={1} flexDirection="column" borderStyle="single" borderColor={typeColors[item.type] || 'white'} paddingX={1}>
          <Box>
            <Text color={typeColors[item.type] || 'white'}>
              {typeIcons[item.type] || '•'} {item.title}
              {item.completed && <Text color="green"> [DONE]</Text>}
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="gray" wrap="wrap">{item.content}</Text>
          </Box>
        </Box>
      ))}
      {searchResults.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold color="yellow">Recent Search Results</Text>
          {searchResults.slice(-5).map((r, i) => (
            <Box key={i} marginBottom={1} flexDirection="column">
              <Text color="cyan">{r.title}</Text>
              <Text color="gray" wrap="wrap">{r.snippet?.slice(0, 120)}...</Text>
              <Text color="blue" dimColor>{r.url}</Text>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CanvasPanel;
