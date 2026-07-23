export type Phase = 'discovery' | 'validation' | 'analysis' | 'verdict' | 'planning';

export type LLMProvider = 'openai' | 'anthropic' | 'openrouter' | 'lmstudio' | 'ollama';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  phase?: Phase;
  agentId?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  updatedAt: number;
  currentPhase: Phase;
  status: 'active' | 'archived';
}

export interface ResearchFinding {
  id: string;
  projectId: string;
  type: 'web' | 'reddit' | 'x' | 'competitor' | 'market';
  title: string;
  url: string;
  snippet: string;
  source: string;
  createdAt: number;
}

export interface CanvasItem {
  id: string;
  projectId: string;
  type: 'note' | 'task' | 'plan' | 'finding' | 'verdict';
  title: string;
  content: string;
  metadata: Record<string, any>;
  completed: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: 'critic' | 'researcher' | 'validator' | 'planner';
  provider: LLMProvider;
  model: string;
  systemPrompt: string;
}

export interface AppConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
  maxAgents: number;
  autoSave: boolean;
  defaultOutputDir: string;
  theme: 'dark' | 'light';
  fontSize: number;
  tavilyApiKey?: string;
  redditClientId?: string;
  redditClientSecret?: string;
  xBearerToken?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}
