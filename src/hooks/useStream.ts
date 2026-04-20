import { useCallback, useRef } from 'react';
import { useChat } from './useChat';
import { useAgent } from './useAgent';
import { API_ENDPOINT } from '../utils/constants';
import type { Message } from '../types/chat';

export function useStream() {
  const { addAssistantMessage, setStreaming, updateToolCall, updateLastAssistantMessage } = useChat();
  const { getCurrentAgentConfig } = useAgent();
  const currentMessageRef = useRef<string>('');
  const currentToolCallsRef = useRef<any[]>([]);
  const hasStartedStreaming = useRef<boolean>(false);

  const streamResponse = useCallback(async (
    messages: Message[],
    apiProvider: 'deepseek' | 'doubao' = 'deepseek'
  ): Promise<void> => {
    const agentConfig = getCurrentAgentConfig();
    if (!agentConfig) {
      throw new Error('No agent configuration found');
    }

    currentMessageRef.current = '';
    currentToolCallsRef.current = [];
    hasStartedStreaming.current = false;
    setStreaming(true);

    try {
      const endpoint = apiProvider === 'doubao' ? '/doubao' : '/chat';
      const response = await fetch(`${API_ENDPOINT}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          agentConfig
        })
      });
      console.log(JSON.stringify((messages)));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              // Stream finished
              break;
            }

            try {
              const chunk = JSON.parse(data);
              switch (chunk.type) {
                case 'content':
                  // Add content chunk
                  currentMessageRef.current += chunk.content;

                  // Start streaming on first content chunk
                  if (!hasStartedStreaming.current) {
                    addAssistantMessage(currentMessageRef.current);
                    hasStartedStreaming.current = true;
                  } else {
                    // Update the existing message in real-time
                    updateLastAssistantMessage(currentMessageRef.current);
                  }
                  break;

                case 'tool_call':
                  if (chunk.tool_call) {
                    currentToolCallsRef.current.push({
                      id: chunk.tool_call.id,
                      tool_name: chunk.tool_call.tool_name,
                      parameters: chunk.tool_call.parameters,
                      status: 'pending' as const
                    });
                  }
                  break;

                case 'error':
                  console.error('Stream error:', chunk.error);
                  currentMessageRef.current += `\n\n[Error: ${chunk.error}]`;
                  if (!hasStartedStreaming.current) {
                    addAssistantMessage(currentMessageRef.current);
                    hasStartedStreaming.current = true;
                  } else {
                    updateLastAssistantMessage(currentMessageRef.current);
                  }
                  break;

                case 'done':
                  // Final update to ensure all content is displayed
                  if (hasStartedStreaming.current) {
                    updateLastAssistantMessage(currentMessageRef.current);
                  } else {
                    addAssistantMessage(
                      currentMessageRef.current,
                      currentToolCallsRef.current.length > 0 ? currentToolCallsRef.current : undefined
                    );
                  }
                  break;
              }
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming failed:', error);
      addAssistantMessage(`[Error: ${error instanceof Error ? error.message : 'Unknown error'}]`);
    } finally {
      setStreaming(false);
    }
  }, [getCurrentAgentConfig, addAssistantMessage, setStreaming, updateLastAssistantMessage]);

  const executeTool = useCallback(async (
    toolCallId: string,
    toolName: string,
    params: Record<string, unknown>
  ): Promise<void> => {
    updateToolCall(toolCallId, { status: 'pending' });

    try {
      const response = await fetch(`${API_ENDPOINT}/tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toolName,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      updateToolCall(toolCallId, {
        status: 'completed',
        result: result.data
      });
    } catch (error) {
      updateToolCall(toolCallId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [updateToolCall]);

  return {
    streamResponse,
    executeTool,
    isStreaming: useChat().isStreaming
  };
}
