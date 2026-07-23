import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

interface Props {
  onClose: () => void;
  onCommand: (command: string) => void;
}

const commands = [
  { key: 'n', label: 'New Project', command: 'new-project' },
  { key: 'o', label: 'Open Project', command: 'open-project' },
  { key: 'r', label: 'Focus Chat', command: 'research' },
  { key: 'c', label: 'Focus Canvas', command: 'canvas' },
  { key: 's', label: 'Settings', command: 'settings' },
  { key: 'q', label: 'Quit', command: 'quit' },
];

const CommandPalette: React.FC<Props> = ({ onClose, onCommand }) => {
  const [selected, setSelected] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
    }
    if (input === 'j' || key.downArrow) {
      setSelected(s => (s + 1) % commands.length);
    }
    if (input === 'k' || key.upArrow) {
      setSelected(s => (s - 1 + commands.length) % commands.length);
    }
    if (key.return) {
      onCommand(commands[selected].command);
    }
  });

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">
        Command Palette (Ctrl+P)
      </Text>
      <Box marginTop={1}>
        {commands.map((cmd, i) => (
          <Box key={cmd.command}>
            <Text color={i === selected ? 'green' : 'white'}>
              {i === selected ? '▸ ' : '  '}{cmd.label} <Text color="gray">({cmd.key})</Text>
            </Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Use ↑/↓ or j/k to navigate, Enter to select, Esc to close</Text>
      </Box>
    </Box>
  );
};

export default CommandPalette;
