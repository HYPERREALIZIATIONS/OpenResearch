import { LLMClient, LLMMessage } from '../llm/client';
import { Phase, Message } from '../types';

export interface AgentContext {
  projectId: string;
  phase: Phase;
  messages: Message[];
  llm: LLMClient;
}

export abstract class BaseAgent {
  abstract id: string;
  abstract name: string;
  abstract systemPrompt: string;

  async execute(context: AgentContext): Promise<string> {
    const messages: LLMMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...context.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];
    const response = await context.llm.chat(messages);
    return response.content;
  }
}

export class CriticAgent extends BaseAgent {
  id = 'critic';
  name = 'Critic';
  systemPrompt = `You are the Critic — a brutally honest, skeptical research partner for entrepreneurs and creators. Your job is to challenge assumptions, force specificity, and expose weaknesses.

RULES:
- Never agree blindly. Always question vague claims.
- Ask for: target customer, problem statement, evidence of demand, competition, revenue model, differentiation.
- If the user says "I don't know" or is vague, push for specifics.
- Point out logical fallacies, confirmation bias, and delusional thinking.
- Be direct and harsh, but constructive.
- Format responses as clear, concise questions or challenges.`;

  async execute(context: AgentContext): Promise<string> {
    const discoveryMessages = context.messages.filter(m => m.phase === 'discovery' || !m.phase);
    const messages: LLMMessage[] = [
      { role: 'system', content: this.systemPrompt },
      ...discoveryMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];
    const response = await context.llm.chat(messages);
    return response.content;
  }
}

export class ResearcherAgent extends BaseAgent {
  id = 'researcher';
  name = 'Researcher';
  systemPrompt = `You are the Researcher — an autonomous investigator who gathers real-world evidence from the web, Reddit, and X to validate or refute claims.

When given a research task:
1. Identify what needs verification.
2. Search for real conversations, reviews, and data.
3. Present findings with citations and source URLs.
4. Highlight contradictions, complaints, and market signals.
5. Be thorough — include both supporting and opposing evidence.

Always format findings with clear citations: [Source: URL]`;

  async execute(context: AgentContext): Promise<string> {
    const lastMessage = context.messages[context.messages.length - 1];
    const messages: LLMMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: `Research this thoroughly and present findings with citations:\n\n${lastMessage?.content || 'General market research'}` },
    ];
    const response = await context.llm.chat(messages);
    return response.content;
  }
}

export class ValidatorAgent extends BaseAgent {
  id = 'validator';
  name = 'Validator';
  systemPrompt = `You are the Validator — an impartial evaluator who synthesizes all research and evidence into a clear, brutal verdict.

When evaluating:
1. Summarize key evidence (supporting and opposing).
2. Assess: market demand, competition, feasibility, risks.
3. Give a clear verdict: "WORTH PURSUING" or "WASTE OF TIME".
4. Provide detailed reasoning — no sugar-coating.
5. If borderline, explain the conditions that would tip the balance.

Be direct. Your verdict should be unambiguous.`;

  async execute(context: AgentContext): Promise<string> {
    const allContent = context.messages.map(m => `[${m.role}]: ${m.content}`).join('\n\n');
    const messages: LLMMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: `Based on all the research and conversation below, give your verdict:\n\n${allContent}` },
    ];
    const response = await context.llm.chat(messages);
    return response.content;
  }
}

export class PlannerAgent extends BaseAgent {
  id = 'planner';
  name = 'Planner';
  systemPrompt = `You are the Planner — a strategic action designer who creates realistic, phase-based execution plans.

When creating a plan:
1. Break the work into phases (Discovery, MVP, Validation, Launch, Growth).
2. For each phase, list specific, actionable tasks.
3. Assign rough time estimates.
4. Identify dependencies between tasks.
5. Flag high-risk steps that need validation first.
6. Be realistic — no "launch in 30 days" nonsense unless truly feasible.

Format as a numbered plan with phases and tasks.`;

  async execute(context: AgentContext): Promise<string> {
    const lastMessage = context.messages[context.messages.length - 1];
    const messages: LLMMessage[] = [
      { role: 'system', content: this.systemPrompt },
      { role: 'user', content: `Create a realistic action plan for:\n\n${lastMessage?.content || 'This project'}` },
    ];
    const response = await context.llm.chat(messages);
    return response.content;
  }
}
