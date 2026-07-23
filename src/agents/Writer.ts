import { Agent } from './Agent';

export class Writer extends Agent {
  constructor(id: string) {
    super(id, `Writer ${id}`, 'writer');
  }

  async execute(task: string): Promise<string> {
    this.setStatus('working');
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.setStatus('completed');
    return `Report: ${task}\n\n# Executive Summary\n\nThis report covers the research findings...`;
  }
}
