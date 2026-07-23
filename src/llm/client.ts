import { LLMProvider, AppConfig } from '../types';
import { settings } from '../config/settings';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
}

export abstract class BaseLLMProvider {
  constructor(protected config: AppConfig) {}

  abstract chat(messages: LLMMessage[]): Promise<LLMResponse>;
  abstract stream?(messages: LLMMessage[]): AsyncIterable<string>;
}

export class OpenAIProvider extends BaseLLMProvider {
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${text}`);
    }

    const data = await response.json() as any;
    return {
      content: data.choices[0]?.message?.content ?? '',
      provider: 'openai',
      model: this.config.model,
    };
  }
}

export class AnthropicProvider extends BaseLLMProvider {
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const systemMessage = messages.find(m => m.role === 'system')?.content ?? '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 4096,
        system: systemMessage,
        messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${text}`);
    }

    const data = await response.json() as any;
    return {
      content: data.content[0]?.text ?? '',
      provider: 'anthropic',
      model: this.config.model,
    };
  }
}

export class OpenRouterProvider extends BaseLLMProvider {
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'https://openrouter.ai/api/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
        'HTTP-Referer': 'https://openresearch.dev',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${text}`);
    }

    const data = await response.json() as any;
    return {
      content: data.choices[0]?.message?.content ?? '',
      provider: 'openrouter',
      model: this.config.model,
    };
  }
}

export class LMStudioProvider extends BaseLLMProvider {
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:1234/v1';
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LM Studio error: ${response.status} ${text}`);
    }

    const data = await response.json() as any;
    return {
      content: data.choices[0]?.message?.content ?? '',
      provider: 'lmstudio',
      model: this.config.model,
    };
  }
}

export class OllamaProvider extends BaseLLMProvider {
  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    const baseUrl = this.config.baseUrl || 'http://localhost:11434';
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama error: ${response.status} ${text}`);
    }

    const data = await response.json() as any;
    return {
      content: data.message?.content ?? '',
      provider: 'ollama',
      model: this.config.model,
    };
  }
}

export class LLMClient {
  private provider: BaseLLMProvider;

  constructor(config: AppConfig) {
    switch (config.provider) {
      case 'openai':
        this.provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(config);
        break;
      case 'openrouter':
        this.provider = new OpenRouterProvider(config);
        break;
      case 'lmstudio':
        this.provider = new LMStudioProvider(config);
        break;
      case 'ollama':
        this.provider = new OllamaProvider(config);
        break;
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async chat(messages: LLMMessage[]): Promise<LLMResponse> {
    if (!settings.get('apiKey') && !['lmstudio', 'ollama'].includes(settings.get('provider'))) {
      throw new Error('API key not configured. Use Ctrl+P → Settings to configure.');
    }
    return this.provider.chat(messages);
  }
}
