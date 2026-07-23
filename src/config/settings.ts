import Conf from 'conf';
import { AppConfig, LLMProvider } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  provider: 'openai',
  apiKey: '',
  model: 'gpt-4o-mini',
  baseUrl: '',
  maxAgents: 4,
  autoSave: true,
  defaultOutputDir: './openresearch-data',
  theme: 'dark',
  fontSize: 14,
};

export class SettingsManager {
  private config: Conf<AppConfig>;

  constructor() {
    this.config = new Conf<AppConfig>({
      projectName: 'openresearch',
      defaults: DEFAULT_CONFIG,
    });
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config.get(key);
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config.set(key, value);
  }

  getAll(): AppConfig {
    return this.config.store as unknown as AppConfig;
  }

  reset(): void {
    this.config.clear();
  }
}

export const settings = new SettingsManager();
