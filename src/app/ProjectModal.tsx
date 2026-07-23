import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { Project } from '../types';

interface Props {
  projects: Project[];
  currentProject: Project | null;
  onCreate: (name: string, description: string) => void;
  onSelect: (project: Project) => void;
  onClose: () => void;
}

const ProjectModal: React.FC<Props> = ({ projects, currentProject, onCreate, onSelect, onClose }) => {
  const [mode, setMode] = useState<'choose' | 'create'>('choose');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onClose();
    }
    if (mode === 'choose') {
      if (input === 'n') {
        setMode('create');
      }
      if (input === 'j' || key.downArrow) {
        setSelectedIdx(s => Math.min(s + 1, projects.length));
      }
      if (input === 'k' || key.upArrow) {
        setSelectedIdx(s => Math.max(s - 1, 0));
      }
      if (key.return && selectedIdx < projects.length) {
        onSelect(projects[selectedIdx]);
        onClose();
      }
    } else {
      if (key.return && name.trim()) {
        onCreate(name.trim(), description.trim());
      }
      if (key.backspace) {
        if (description.length > 0) {
          setDescription(prev => prev.slice(0, -1));
        } else if (name.length > 0) {
          setName(prev => prev.slice(0, -1));
        }
      }
      if (input && !key.ctrl && !key.meta) {
        if (description.length > 0 || name.length > 0) {
          setDescription(prev => prev + input);
        } else {
          setName(prev => prev + input);
        }
      }
    }
  });

  if (mode === 'create') {
    return (
      <Box flexDirection="column" borderStyle="double" borderColor="green" paddingX={1}>
        <Text bold color="green">New Project</Text>
        <Box>
          <Text>Name: </Text>
          <TextInput value={name} onChange={setName} placeholder="Project name" />
        </Box>
        <Box>
          <Text>Description: </Text>
          <TextInput value={description} onChange={setDescription} placeholder="Brief description" />
        </Box>
        <Box marginTop={1}>
          <Text color="gray">Press Enter to create, Esc to cancel</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">Select Project (N = New)</Text>
      <Box marginTop={1} flexDirection="column">
        {projects.length === 0 && (
          <Text color="gray">No projects yet. Press 'n' to create one.</Text>
        )}
        {projects.map((p, i) => (
          <Box key={p.id}>
            <Text color={i === selectedIdx ? 'green' : 'white'}>
              {i === selectedIdx ? '▸ ' : '  '}{p.name} <Text color="gray">({new Date(p.createdAt).toLocaleDateString()})</Text>
              {currentProject?.id === p.id && <Text color="yellow"> [ACTIVE]</Text>}
            </Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">Press Enter to open, 'n' for new, Esc to close</Text>
      </Box>
    </Box>
  );
};

export default ProjectModal;
