import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { settings } from '../config/settings';

interface Props {
  onClose: () => void;
}

const SettingsPanel: React.FC<Props> = ({ onClose }) => {
  const [config, setConfig] = useState(settings.getAll());
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useInput((input, key) => {
    if (key.escape) {
      if (editing) {
        setEditing(null);
        setEditValue('');
      } else {
        onClose();
      }
    }
    if (editing) {
      if (key.return) {
        if (editing === 'maxAgents' || editing === 'fontSize') {
          settings.set(editing, parseInt(editValue) || config[editing]);
        } else {
          settings.set(editing, editValue);
        }
        setEditing(null);
        setEditValue('');
        setConfig(settings.getAll());
      }
      if (key.backspace || key.delete) {
        setEditValue(prev => prev.slice(0, -1));
      }
      if (input && !key.ctrl && !key.meta) {
        setEditValue(prev => prev + input);
      }
    } else {
      if (input >= '1' && input <= '9') {
        const keys = Object.keys(config) as string[];
        const idx = parseInt(input) - 1;
        if (idx < keys.length) {
          setEditing(keys[idx]);
          setEditValue(String(config[keys[idx]]));
        }
      }
    }
  });

  const entries = Object.entries(config) as [string, any][];

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="yellow" paddingX={1}>
      <Text bold color="yellow">Settings</Text>
      <Text color="gray">Press number key to edit, Esc to close</Text>
      <Box marginTop={1} flexDirection="column">
        {entries.map(([key, value], i) => (
          <Box key={key}>
            <Text color={editing === key ? 'green' : 'white'}>
              {i + 1}. {key}: <Text color="cyan">{String(value)}</Text>
              {editing === key && <Text color="green"> ← editing</Text>}
            </Text>
          </Box>
        ))}
      </Box>
      {editing && (
        <Box marginTop={1}>
          <Text color="yellow">Edit value: </Text>
          <Text color="green">{editValue}</Text>
        </Box>
      )}
    </Box>
  );
};

export default SettingsPanel;
