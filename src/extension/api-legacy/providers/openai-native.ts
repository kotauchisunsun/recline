import type { Anthropic } from "@anthropic-ai/sdk";

import type {
  ApiHandlerOptions,
  ModelInfo,
  OpenAiNativeModelId
} from "@shared/api";

import type { ModelProvider } from "..";
import type { ApiStream } from "../transform/stream";

import OpenAI from "openai";

import {
  openAiNativeDefaultModelId,
  openAiNativeModels
} from "@shared/api";

import { convertToOpenAiMessages } from "../transform/openai-format";


export class OpenAiNativeModelProvider implements ModelProvider {
  private client: OpenAI;
  private options: ApiHandlerOptions;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new OpenAI({
      apiKey: this.options.openAiNativeApiKey
    });
  }

  async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
    const model = await this.getModel();
    switch (model.id) {
      case "o1-preview":
      case "o1-mini": {
        // o1 doesnt support streaming, non-1 temp, or system prompt
        const response = await this.client.chat.completions.create({
          model: model.id,
          messages: [{ role: "user", content: systemPrompt }, ...convertToOpenAiMessages(messages)]
        });
        yield {
          type: "text",
          text: response.choices[0]?.message.content || ""
        };
        yield {
          type: "usage",
          inputTokens: response.usage?.prompt_tokens || 0,
          outputTokens: response.usage?.completion_tokens || 0
        };
        break;
      }
      default: {
        const stream = await this.client.chat.completions.create({
          model: model.id,
          // max_completion_tokens: model.info.maxTokens,
          temperature: 0,
          messages: [{ role: "system", content: systemPrompt }, ...convertToOpenAiMessages(messages)],
          stream: true,
          stream_options: { include_usage: true }
        });

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (delta?.content) {
            yield {
              type: "text",
              text: delta.content
            };
          }

          // contains a null value except for the last chunk which contains the token usage statistics for the entire request
          if (chunk.usage) {
            yield {
              type: "usage",
              inputTokens: chunk.usage.prompt_tokens || 0,
              outputTokens: chunk.usage.completion_tokens || 0
            };
          }
        }
      }
    }
  }

  async getModel(): Promise<{ id: OpenAiNativeModelId; info: ModelInfo }> {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in openAiNativeModels) {
      const id = modelId as OpenAiNativeModelId;
      return { id, info: openAiNativeModels[id] };
    }
    return { id: openAiNativeDefaultModelId, info: openAiNativeModels[openAiNativeDefaultModelId] };
  }
}
