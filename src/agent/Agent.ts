import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '../types/chat';
import type { AgentConfig, StreamChunk } from '../types/agent';
import type { Tool } from '../types/tool';

export class Agent {
  private anthropic: Anthropic;
  private config: AgentConfig;
  private tools: Map<string, Tool>;

  constructor(config: AgentConfig, tools: Tool[], apiKey: string) {
    this.config = config;
    this.tools = new Map(tools.map(tool => [tool.id, tool]));
    this.anthropic = new Anthropic({ apiKey });
  }

  async chat(messages: Message[]): Promise<AsyncIterable<StreamChunk>> {
    const systemPrompt = this.config.system_prompt || `You are a helpful AI assistant.`;

    try {
      const stream = await this.anthropic.messages.stream({
        model: this.config.model,
        max_tokens: this.config.max_tokens || 1024,
        temperature: this.config.temperature || 0.7,
        system: systemPrompt,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        tools: this.getToolDefinitions()
      });

      return this.processStream(stream);
    } catch (error) {
      return this.createErrorStream(error);
    }
  }

  private getToolDefinitions() {
    const availableTools = this.config.tools
      .map(toolId => this.tools.get(toolId))
      .filter((tool): tool is Tool => tool !== undefined);

    return availableTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: {
        type: 'object',
        properties: tool.parameters.reduce((acc, param) => ({
          ...acc,
          [param.name]: {
            type: param.type,
            description: param.description
          }
        }), {}),
        required: tool.parameters.filter(p => p.required).map(p => p.name)
      }
    }));
  }

  private async *processStream(stream: Anthropic.MessageStream): AsyncIterable<StreamChunk> {
    for await (const event of stream) {
      switch (event.type) {
        case 'content_block_delta':
          if (event.delta.type === 'text_delta') {
            yield {
              type: 'content',
              content: event.delta.text
            };
          }
          break;

        case 'content_block_stop':
          // Content block finished
          break;

        case 'tool_use':
          yield {
            type: 'tool_call',
            tool_call: {
              id: event.toolUse.id,
              tool_name: event.toolUse.name,
              parameters: event.toolUse.input as Record<string, unknown>
            }
          };
          break;

        case 'error':
          yield {
            type: 'error',
            error: event.error.message
          };
          break;

        case 'message_stop':
          yield {
            type: 'done'
          };
          break;
      }
    }
  }

  private async *createErrorStream(error: unknown): AsyncIterable<StreamChunk> {
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }

  async executeTool(toolId: string, params: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${toolId}`);
    }

    try {
      return await tool.execute(params);
    } catch (error) {
      throw new Error(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  updateConfig(updates: Partial<AgentConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }
}
