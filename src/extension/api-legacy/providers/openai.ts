import type { Anthropic } from "@anthropic-ai/sdk";

import type {
  ApiHandlerOptions,
  ModelInfo
} from "@shared/api";

import type { ModelProvider } from "../index";
import type { ApiStream } from "../transform/stream";

import OpenAI, { AzureOpenAI } from "openai";

import {
  azureOpenAiDefaultApiVersion,
  openAiModelInfoSaneDefaults
} from "@shared/api";

import { convertToOpenAiMessages } from "../transform/openai-format";


export class OpenAIModelProvider implements ModelProvider {
  private client: OpenAI;
  private options: ApiHandlerOptions;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    // Azure API shape slightly differs from the core API shape: https://github.com/openai/openai-node?tab=readme-ov-file#microsoft-azure-openai
    if (this.options.openAiBaseUrl?.toLowerCase().includes("azure.com")) {
      this.client = new AzureOpenAI({
        baseURL: this.options.openAiBaseUrl,
        apiKey: this.options.openAiApiKey,
        apiVersion: this.options.azureApiVersion || azureOpenAiDefaultApiVersion
      });
    }
    else {
      this.client = new OpenAI({
        baseURL: this.options.openAiBaseUrl,
        apiKey: this.options.openAiApiKey
      });
    }
  }

  async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
    const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...convertToOpenAiMessages(messages)
    ];
    const stream = await this.client.chat.completions.create({
      model: this.options.openAiModelId ?? "",
      messages: openAiMessages,
      temperature: 0,
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
      if (chunk.usage) {
        yield {
          type: "usage",
          inputTokens: chunk.usage.prompt_tokens || 0,
          outputTokens: chunk.usage.completion_tokens || 0
        };
      }
    }
  }

  async getModel(): Promise<{ id: string; info: ModelInfo }> {
    return {
      id: this.options.openAiModelId ?? "",
      info: openAiModelInfoSaneDefaults
    };
  }
}
