import { Agent } from './Agent';

export class Researcher extends Agent {
  constructor(id: string) {
    super(id, `Researcher ${id}`, 'researcher');
  }

  async execute(task: string): Promise<string> {
    this.setStatus('working');
    await new Promise(resolve => setTimeout(resolve, 2000));
    this.setStatus('completed');
    return `Research findings for: ${task}\n\nKey points discovered:\n1. Point one\n2. Point two\n3. Point three`;
  }
}
