import React from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Message, Phase } from '../types';

interface Props {
  messages: Message[];
  input: string;
  setInput: (val: string) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  status: string;
  currentPhase: Phase;
}

const ChatPanel: React.FC<Props> = ({ messages, input, setInput, onSubmit, isProcessing, status, currentPhase }) => {
  useInput((input, key) => {
    if (key.return && !key.ctrl) {
      onSubmit();
    }
  });

  const phaseColors: Record<Phase, string> = {
    discovery: 'cyan',
    validation: 'blue',
    analysis: 'magenta',
    verdict: 'red',
    planning: 'green',
  };

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box paddingX={1}>
        <Text color="gray">Phase: </Text>
        <Text color={phaseColors[currentPhase]}>{currentPhase.toUpperCase()}</Text>
        <Text color="gray"> | Status: </Text>
        <Text color={isProcessing ? 'yellow' : 'gray'}>{status}</Text>
      </Box>
      <Box flexGrow={1} flexDirection="column" paddingX={1} marginTop={1}>
        {messages.length === 0 && (
          <Box>
            <Text color="gray" dimColor>
              Describe your idea to begin. The Critic will challenge your assumptions.
            </Text>
          </Box>
        )}
        {messages.map(msg => (
          <Box key={msg.id} marginBottom={1} flexDirection="column">
            <Box>
              <Text bold color={msg.role === 'user' ? 'blue' : msg.agentId === 'critic' ? 'red' : msg.agentId === 'researcher' ? 'cyan' : msg.agentId === 'validator' ? 'magenta' : 'green'}>
                [{msg.role === 'user' ? 'YOU' : msg.agentId?.toUpperCase() || 'ASSISTANT'}]
              </Text>
            </Box>
            <Box marginLeft={2}>
              <Text wrap="wrap">{msg.content}</Text>
            </Box>
          </Box>
        ))}
        {isProcessing && (
          <Box>
            <Text color="yellow">Thinking...</Text>
          </Box>
        )}
      </Box>
      <Box paddingX={1} marginBottom={1}>
        <Text color="green">You: </Text>
        <TextInput
          value={input}
          onChange={setInput}
          placeholder="Type your idea or answer..."
          onSubmit={onSubmit}
        />
      </Box>
    </Box>
  );
};

export default ChatPanel;
