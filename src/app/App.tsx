import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import ChatPanel from './ChatPanel';
import CanvasPanel from './CanvasPanel';
import CommandPalette from './CommandPalette';
import SettingsPanel from './SettingsPanel';
import ProjectModal from './ProjectModal';
import { DatabaseManager } from '../db/database';
import { LLMClient } from '../llm/client';
import { CriticAgent, ResearcherAgent, ValidatorAgent, PlannerAgent } from '../agents';
import { Project, Message, CanvasItem, Phase, SearchResult } from '../types';
import { settings } from '../config/settings';
import { SearchService } from '../services/search';

const uuid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

type View = 'none' | 'commandPalette' | 'settings' | 'projectModal';
type Focus = 'chat' | 'canvas';

const db = new DatabaseManager();
let llmClient: LLMClient | null = null;

const AGENTS = {
  critic: new CriticAgent(),
  researcher: new ResearcherAgent(),
  validator: new ValidatorAgent(),
  planner: new PlannerAgent(),
};

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [view, setView] = useState<View>('none');
  const [focus, setFocus] = useState<Focus>('chat');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Ready');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    initApp();
    return () => db.close();
  }, []);

  const initApp = async () => {
    await db.init();
    llmClient = new LLMClient(settings.getAll());
    const rows = db.getDb().prepare('SELECT * FROM projects WHERE status = ?').all('active') as any[];
    const loaded = rows.map(row => ({
      ...row,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
    }));
    setProjects(loaded);
    if (loaded.length > 0) {
      loadProject(loaded[0]);
    }
  };

  const loadProject = (project: Project) => {
    setCurrentProject(project);
    const msgs = db.getDb().prepare('SELECT * FROM messages WHERE project_id = ? ORDER BY timestamp ASC').all(project.id) as any[];
    setMessages(msgs.map(m => ({
      ...m,
      timestamp: Number(m.timestamp),
    })));
    const items = db.getDb().prepare('SELECT * FROM canvas_items WHERE project_id = ?').all(project.id) as any[];
    setCanvasItems(items.map(i => ({
      ...i,
      createdAt: Number(i.created_at),
      updatedAt: Number(i.updated_at),
      metadata: JSON.parse(i.metadata || '{}'),
    })));
    setStatus(`Loaded: ${project.name}`);
  };

  const createProject = (name: string, description: string) => {
    const project: Project = {
      id: uuid(),
      name,
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentPhase: 'discovery',
      status: 'active',
    };
    db.getDb().prepare('INSERT INTO projects (id, name, description, created_at, updated_at, current_phase, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      project.id, project.name, project.description, project.createdAt, project.updatedAt, project.currentPhase, project.status
    );
    setProjects(prev => [...prev, project]);
    loadProject(project);
    setView('none');
    setStatus(`Created: ${name}`);
  };

  const runAgent = async (agentType: 'critic' | 'researcher' | 'validator' | 'planner', userMessage: string) => {
    if (!llmClient || !currentProject) return;

    setIsProcessing(true);
    setStatus(`${agentType === 'critic' ? 'Critic' : agentType === 'researcher' ? 'Researcher' : agentType === 'validator' ? 'Validator' : 'Planner'} is working...`);

    const assistantMsg: Message = {
      id: uuid(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      phase: currentProject.currentPhase,
      agentId: agentType,
    };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const context = {
        projectId: currentProject.id,
        phase: currentProject.currentPhase,
        messages: [...messages, { role: 'user' as const, content: userMessage }],
        llm: llmClient,
      };

      const response = await AGENTS[agentType].execute(context);

      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: response } : m));
      db.getDb().prepare('INSERT INTO messages (id, project_id, role, content, timestamp, phase, agent_id) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        assistantMsg.id, currentProject.id, 'assistant', response, assistantMsg.timestamp, currentProject.currentPhase, agentType
      );

      if (agentType === 'researcher') {
        const searchService = new SearchService();
        const results = await searchService.webSearch(userMessage);
        setSearchResults(prev => [...prev, ...results]);
        results.forEach(r => {
          const finding = {
            id: uuid(),
            projectId: currentProject.id,
            type: 'web' as const,
            title: r.title,
            url: r.url,
            snippet: r.snippet,
            source: r.source,
            created_at: Date.now(),
          };
          db.getDb().prepare('INSERT INTO research_findings (id, project_id, type, title, url, snippet, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
            finding.id, finding.projectId, finding.type, finding.title, finding.url, finding.snippet, finding.source, finding.created_at
          );
          setCanvasItems(prev => [...prev, {
            id: finding.id,
            projectId: finding.projectId,
            type: 'finding',
            title: finding.title,
            content: finding.snippet,
            metadata: { url: finding.url, source: finding.source },
            completed: false,
            createdAt: finding.created_at,
            updatedAt: finding.created_at,
          }]);
        });
      }

      if (agentType === 'validator') {
        advancePhase();
      }

      setStatus('Ready');
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: `Error: ${error}` } : m));
      setStatus(`Error: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const advancePhase = () => {
    if (!currentProject) return;
    const phases: Phase[] = ['discovery', 'validation', 'analysis', 'verdict', 'planning'];
    const currentIndex = phases.indexOf(currentProject.currentPhase);
    const nextPhase = phases[currentIndex + 1];
    if (nextPhase) {
      const updated = { ...currentProject, currentPhase: nextPhase, updatedAt: Date.now() };
      setCurrentProject(updated);
      db.getDb().prepare('UPDATE projects SET current_phase = ?, updated_at = ? WHERE id = ?').run(nextPhase, updated.updatedAt, updated.id);
      setCanvasItems(prev => [...prev, {
        id: uuid(),
        projectId: currentProject.id,
        type: 'plan',
        title: `Phase: ${nextPhase.toUpperCase()}`,
        content: `Entered ${nextPhase} phase.`,
        metadata: {},
        completed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }]);
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing || !currentProject) return;

    const userMsg: Message = {
      id: uuid(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
      phase: currentProject.currentPhase,
    };
    setMessages(prev => [...prev, userMsg]);
    db.getDb().prepare('INSERT INTO messages (id, project_id, role, content, timestamp, phase) VALUES (?, ?, ?, ?, ?, ?)').run(
      userMsg.id, currentProject.id, 'user', userMsg.content, userMsg.timestamp, userMsg.phase
    );
    setInput('');

    const phase = currentProject.currentPhase;
    if (phase === 'discovery') {
      await runAgent('critic', userMsg.content);
    } else if (phase === 'validation') {
      await runAgent('researcher', userMsg.content);
    } else if (phase === 'verdict') {
      await runAgent('validator', userMsg.content);
    } else if (phase === 'planning') {
      await runAgent('planner', userMsg.content);
    } else {
      await runAgent('critic', userMsg.content);
    }
  };

  useInput((input, key) => {
    if (view !== 'none') {
      if (key.escape) setView('none');
      return;
    }

    if (key.ctrl && input === 'p') {
      setView('commandPalette');
      return;
    }
    if (key.ctrl && input === 'n') {
      setView('projectModal');
      return;
    }
    if (key.ctrl && input === 'o') {
      if (projects.length > 0) {
        const idx = projects.findIndex(p => p.id === currentProject?.id);
        const next = projects[(idx + 1) % projects.length];
        if (next) loadProject(next);
      }
      return;
    }
    if (key.tab) {
      setFocus(f => f === 'chat' ? 'canvas' : 'chat');
      return;
    }
    if (key.ctrl && input === 's') {
      setStatus('Saved');
      return;
    }
  });

  const handleCommand = useCallback((command: string) => {
    switch (command) {
      case 'new-project':
        setView('projectModal');
        break;
      case 'open-project':
        setView('projectModal');
        break;
      case 'settings':
        setView('settings');
        break;
      case 'research':
        setFocus('chat');
        break;
      case 'canvas':
        setFocus('canvas');
        break;
      case 'quit':
        process.exit(0);
        break;
    }
  }, [projects, currentProject]);

  if (view === 'commandPalette') {
    return <CommandPalette onClose={() => setView('none')} onCommand={handleCommand} />;
  }

  if (view === 'settings') {
    return <SettingsPanel onClose={() => setView('none')} />;
  }

  if (view === 'projectModal') {
    return <ProjectModal projects={projects} currentProject={currentProject} onCreate={createProject} onSelect={loadProject} onClose={() => setView('none')} />;
  }

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="single" borderColor="green" paddingX={1}>
        <Text bold color="green">
          ╔╗ ╔╗ ╔╦╗╔═╗╔╦╗╔═╗
        </Text>
        <Text bold color="cyan">
          ╚═╗║   ║ ║ ║ ║╣ ╠═╣
        </Text>
        <Text bold color="magenta">
          ╚═╝   ╩ ╚═╝═╩ ╩ ╩
        </Text>
        <Text color="gray"> | </Text>
        <Text color={currentProject ? 'white' : 'gray'}>
          {currentProject ? currentProject.name : 'No project'}
        </Text>
        <Text color="gray"> | Phase: </Text>
        <Text color="cyan">{currentProject?.currentPhase || '---'}</Text>
        <Text color="gray"> | </Text>
        <Text color="gray">Focus: </Text>
        <Text color={focus === 'chat' ? 'yellow' : 'blue'}>{focus === 'chat' ? 'Chat' : 'Canvas'}</Text>
        <Text color="gray"> | Ctrl+P: Commands</Text>
      </Box>

      <Box flexGrow={1} flexDirection="row">
        <Box width="50%" flexDirection="column" borderStyle="single" borderColor={focus === 'chat' ? 'yellow' : 'gray'}>
          <Text bold color={focus === 'chat' ? 'yellow' : 'gray'}> Chat / Research Log </Text>
          <ChatPanel
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isProcessing={isProcessing}
            status={status}
            currentPhase={currentProject?.currentPhase || 'discovery'}
          />
        </Box>
        <Box width="50%" flexDirection="column" borderStyle="single" borderColor={focus === 'canvas' ? 'yellow' : 'gray'}>
          <Text bold color={focus === 'canvas' ? 'yellow' : 'gray'}> Canvas / Workspace </Text>
          <CanvasPanel items={canvasItems} searchResults={searchResults} status={status} />
        </Box>
      </Box>
    </Box>
  );
};

export default App;
