export interface ResearchQuery {
  id: string;
  query: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: ResearchResult;
  agentId: string;
  createdAt: Date;
}

export interface ResearchResult {
  summary: string;
  sources: Source[];
  findings: string[];
  rawContent: string;
}

export interface Source {
  url: string;
  title: string;
  snippet: string;
}

export interface AgentConfig {
  id: string;
  name: string;
  type: 'researcher' | 'analyzer' | 'writer';
  status: 'idle' | 'working' | 'completed';
}

export interface AppConfig {
  maxAgents: number;
  autoSaveReports: boolean;
  reportFormat: 'markdown' | 'html';
  defaultOutputDir: string;
  theme: 'dark' | 'light';
  fontSize: number;
}
