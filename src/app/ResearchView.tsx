import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface Props {
  query: string;
  setQuery: (q: string) => void;
  onRun: () => void;
  status: string;
  agents: any[];
}

const ResearchView: React.FC<Props> = ({ query, setQuery, onRun, status, agents }) => {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box>
        <Text color="green">Query: </Text>
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder="Enter research query..."
          onSubmit={onRun}
        />
      </Box>
      <Box marginTop={1}>
        <Text color="blue">Status: {status}</Text>
      </Box>
      <Box marginTop={1}>
        <Text bold>Active Agents:</Text>
      </Box>
      {agents.map(agent => (
        <Box key={agent.id} marginLeft={2}>
          <Text color={agent.status === 'working' ? 'yellow' : 'gray'}>
            [{agent.type}] {agent.name}: {agent.status}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default ResearchView;
