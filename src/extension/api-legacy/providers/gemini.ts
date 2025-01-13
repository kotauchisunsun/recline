import type { Anthropic } from "@anthropic-ai/sdk";

import type { ApiHandlerOptions, GeminiModelId, ModelInfo } from "@shared/api";

import type { ModelProvider } from "..";
import type { ApiStream } from "../transform/stream";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { geminiDefaultModelId, geminiModels } from "@shared/api";

import { convertAnthropicMessageToGemini } from "../transform/gemini-format";


export class GeminiModelProvider implements ModelProvider {
  private client: GoogleGenerativeAI;
  private options: ApiHandlerOptions;

  constructor(options: ApiHandlerOptions) {
    if (!options.geminiApiKey) {
      throw new Error("API key is required for Google Gemini");
    }
    this.options = options;
    this.client = new GoogleGenerativeAI(options.geminiApiKey);
  }

  async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
    const info = await this.getModel();
    const model = this.client.getGenerativeModel({
      model: info.id,
      systemInstruction: systemPrompt
    });
    const result = await model.generateContentStream({
      contents: messages.map(convertAnthropicMessageToGemini),
      generationConfig: {
        // maxOutputTokens: info.maxTokens,
        temperature: 0
      }
    });

    for await (const chunk of result.stream) {
      yield {
        type: "text",
        text: chunk.text()
      };
    }

    const response = await result.response;
    yield {
      type: "usage",
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0
    };
  }

  async getModel(): Promise<{ id: GeminiModelId; info: ModelInfo }> {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in geminiModels) {
      const id = modelId as GeminiModelId;
      return { id, info: geminiModels[id] };
    }
    return { id: geminiDefaultModelId, info: geminiModels[geminiDefaultModelId] };
  }
}
