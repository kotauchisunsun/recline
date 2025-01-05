import type { ApiConfiguration, MessageParamWithTokenCount, ModelInfo } from "@shared/api";

import type { ApiStream } from "./transform/stream";

import { GeminiHandler } from "./providers/gemini";
import { OllamaHandler } from "./providers/ollama";
import { OpenAiHandler } from "./providers/openai";
import { VertexHandler } from "./providers/vertex";
import { DeepSeekHandler } from "./providers/deepseek";
import { LmStudioHandler } from "./providers/lmstudio";
import { AwsBedrockHandler } from "./providers/bedrock";
import { VsCodeLmHandler } from "./providers/vscode-lm";
import { AnthropicHandler } from "./providers/anthropic";
import { OpenRouterHandler } from "./providers/openrouter";
import { OpenAiNativeHandler } from "./providers/openai-native";


export interface ApiHandler {
  createMessage: (systemPrompt: string, messages: MessageParamWithTokenCount[]) => ApiStream;
  getModel: () => Promise<{ id: string; info: ModelInfo }>;
}

export function buildApiHandler(configuration: ApiConfiguration): ApiHandler {
  const { apiProvider, ...options } = configuration;
  switch (apiProvider) {
    case "anthropic":
      return new AnthropicHandler(options);
    case "openrouter":
      return new OpenRouterHandler(options);
    case "bedrock":
      return new AwsBedrockHandler(options);
    case "vertex":
      return new VertexHandler(options);
    case "openai":
      return new OpenAiHandler(options);
    case "ollama":
      return new OllamaHandler(options);
    case "lmstudio":
      return new LmStudioHandler(options);
    case "gemini":
      return new GeminiHandler(options);
    case "openai-native":
      return new OpenAiNativeHandler(options);
    case "deepseek":
      return new DeepSeekHandler(options);
    case "vscode-lm":
      return new VsCodeLmHandler(options);
    default:
      return new AnthropicHandler(options);
  }
}