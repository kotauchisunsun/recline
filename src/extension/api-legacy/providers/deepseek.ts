import type { Anthropic } from "@anthropic-ai/sdk";

import type { ApiHandlerOptions, DeepSeekModelId, ModelInfo } from "@shared/api";

import type { ModelProvider } from "..";
import type { ApiStream } from "../transform/stream";

import OpenAI from "openai";

import { deepSeekDefaultModelId, deepSeekModels } from "@shared/api";

import { convertToOpenAiMessages } from "../transform/openai-format";


export class DeepSeekModelProvider implements ModelProvider {
  private client: OpenAI;
  private options: ApiHandlerOptions;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new OpenAI({
      baseURL: "https://api.deepseek.com/v1",
      apiKey: this.options.deepSeekApiKey
      // Add any additional configuration required by the DeepSeek API
    });
  }

  async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
    const model = await this.getModel();
    try {
      const stream = await this.client.chat.completions.create({
        model: model.id,
        max_tokens: model.info.maxTokens, // Use max_tokens instead of max_completion_tokens
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          ...convertToOpenAiMessages(messages)
        ],
        stream: true,
        streamOptions: { includeUsage: true } // Correct the property name if needed
      });

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices.length > 0) {
          const delta = chunk.choices[0].delta;
          if (delta && delta.content) {
            yield { type: "text", text: delta.content };
          }
        }

        if (chunk.usage) {
          yield {
            type: "usage",
            inputTokens: chunk.usage.prompt_tokens || 0,
            outputTokens: chunk.usage.completion_tokens || 0,
            cacheReadTokens: chunk.usage.prompt_cache_hit_tokens || 0,
            cacheWriteTokens: chunk.usage.prompt_cache_miss_tokens || 0
          };
        }
      }
    }
    catch (error) {
      // Handle any errors that occur during the API call or streaming
      console.error("Error in createMessage:", error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    // Nothing to dispose...
  }

  async getModel(): Promise<{ id: DeepSeekModelId; info: ModelInfo }> {
    const modelId = this.options.apiModelId;
    if (modelId && deepSeekModels.hasOwnProperty(modelId)) {
      return { id: modelId as DeepSeekModelId, info: deepSeekModels[modelId] };
    }
    return {
      id: deepSeekDefaultModelId,
      info: deepSeekModels[deepSeekDefaultModelId]
    };
  }
}
