import Conf from 'conf';
import { AppConfig } from '../types';

const DEFAULT_CONFIG: AppConfig = {
  maxAgents: 4,
  autoSaveReports: true,
  reportFormat: 'markdown',
  defaultOutputDir: './reports',
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

  get(key: keyof AppConfig): any {
    return this.config.get(key);
  }

  set(key: keyof AppConfig, value: any): void {
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
