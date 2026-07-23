import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import CommandPalette from './CommandPalette';
import SettingsPanel from './SettingsPanel';
import ResearchView from './ResearchView';
import ReportView from './ReportView';
import { ResearchEngine } from '../engine/ResearchEngine';
import { Researcher } from '../agents/Researcher';
import { Analyzer } from '../agents/Analyzer';
import { Writer } from '../agents/Writer';
import { ReportGenerator } from '../reports/generator';
import { Storage } from '../utils/storage';

type View = 'research' | 'reports';

const App: React.FC = () => {
  const [view, setView] = useState<View>('research');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [query, setQuery] = useState('');
  const [researchEngine] = useState(() => {
    const engine = new ResearchEngine();
    engine.addAgent(new Researcher('r1'));
    engine.addAgent(new Researcher('r2'));
    engine.addAgent(new Analyzer('a1'));
    engine.addAgent(new Writer('w1'));
    return engine;
  });
  const [status, setStatus] = useState('Ready');
  const [reports, setReports] = useState<string[]>([]);
  const reportGenerator = new ReportGenerator();

  useInput((input, key) => {
    if (key.ctrl && input === 'p') {
      setShowCommandPalette(true);
    }
    if (key.ctrl && input === 'c') {
      process.exit(0);
    }
  });

  const handleCommand = useCallback((command: string) => {
    switch (command) {
      case 'settings':
        setShowSettings(true);
        setShowCommandPalette(false);
        break;
      case 'research':
        setView('research');
        setShowCommandPalette(false);
        break;
      case 'reports':
        setView('reports');
        setShowCommandPalette(false);
        break;
      case 'quit':
        process.exit(0);
        break;
    }
  }, []);

  const runResearch = async () => {
    if (!query.trim()) return;
    setStatus('Running multi-agent research...');
    try {
      const results = await researchEngine.runResearch(query);
      setStatus('Research completed');
      
      const reportContent = Array.from(results.values()).join('\n\n---\n\n');
      const reportPath = await reportGenerator.generate(query, reportContent);
      setReports(prev => [...prev, reportPath]);
      setStatus(`Report saved: ${reportPath}`);
    } catch (error) {
      setStatus(`Error: ${error}`);
    }
  };

  if (showCommandPalette) {
    return (
      <CommandPalette
        onClose={() => setShowCommandPalette(false)}
        onCommand={handleCommand}
      />
    );
  }

  if (showSettings) {
    return (
      <SettingsPanel
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="double" borderColor="green" paddingX={1}>
        <Text bold color="green">
          OpenResearch - Multi-Agent Research Tool
        </Text>
        <Text> | </Text>
        <Text color="gray">
          View: {view} | Agents: {researchEngine.getAgents().length} | Ctrl+P: Commands
        </Text>
      </Box>

      <Box flexGrow={1} marginY={1}>
        {view === 'research' && (
          <ResearchView
            query={query}
            setQuery={setQuery}
            onRun={runResearch}
            status={status}
            agents={researchEngine.getAgents()}
          />
        )}
        {view === 'reports' && (
          <ReportView reports={reports} />
        )}
      </Box>
    </Box>
  );
};

export default App;
