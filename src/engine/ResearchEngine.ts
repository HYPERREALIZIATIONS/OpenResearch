import { Researcher } from '../agents/Researcher';
import { Analyzer } from '../agents/Analyzer';
import { Writer } from '../agents/Writer';
import { Agent } from '../agents/Agent';

export class ResearchEngine {
  private agents: Agent[] = [];
  private results: Map<string, string> = new Map();

  addAgent(agent: Agent): void {
    this.agents.push(agent);
  }

  async runResearch(query: string): Promise<Map<string, string>> {
    this.results.clear();
    
    const researchers = this.agents.filter(a => a.type === 'researcher');
    const analyzer = this.agents.find(a => a.type === 'analyzer');
    const writer = this.agents.find(a => a.type === 'writer');

    const researchPromises = researchers.map(r => r.execute(query));
    const researchResults = await Promise.all(researchPromises);
    
    researchers.forEach((r, i) => {
      this.results.set(r.id, researchResults[i]);
    });

    if (analyzer) {
      const analysis = await analyzer.execute(query);
      this.results.set(analyzer.id, analysis);
    }

    if (writer) {
      const report = await writer.execute(query);
      this.results.set(writer.id, report);
    }

    return this.results;
  }

  getAgents(): Agent[] {
    return this.agents;
  }
}
