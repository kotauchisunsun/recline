import type { ApiConfiguration, MessageParamWithTokenCount, ModelInfo } from "@shared/api";

import type { ApiStream } from "./transform/stream";

import { GeminiModelProvider } from "./providers/gemini";
import { OllamaModelProvider } from "./providers/ollama";
import { OpenAIModelProvider } from "./providers/openai";
import { VertexModelProvider } from "./providers/vertex";
import { BedrockModelProvider } from "./providers/bedrock";
import { DeepSeekModelProvider } from "./providers/deepseek";
import { LmStudioModelProvider } from "./providers/lmstudio";
import { VSCodeLmModelProvider } from "./providers/vscode-lm";
import { AnthropicModelProvider } from "./providers/anthropic";
import { OpenRouterModelProvider } from "./providers/openrouter";
import { OpenAiNativeModelProvider } from "./providers/openai-native";


export interface Model {
  id: string;
  info: ModelInfo;
}
export interface ModelProvider {
  createMessage: (systemPrompt: string, messages: MessageParamWithTokenCount[]) => ApiStream;
  getModel: () => Promise<Model>;
  dispose: () => Promise<void>;
}

export function buildApiHandler(configuration: ApiConfiguration): ModelProvider {
  const { apiProvider, ...options } = configuration;
  switch (apiProvider) {
    case "anthropic":
      return new AnthropicModelProvider(options);
    case "openrouter":
      return new OpenRouterModelProvider(options);
    case "bedrock":
      return new BedrockModelProvider(options);
    case "vertex":
      return new VertexModelProvider(options);
    case "openai":
      return new OpenAIModelProvider(options);
    case "ollama":
      return new OllamaModelProvider(options);
    case "lmstudio":
      return new LmStudioModelProvider(options);
    case "gemini":
      return new GeminiModelProvider(options);
    case "openai-native":
      return new OpenAiNativeModelProvider(options);
    case "deepseek":
      return new DeepSeekModelProvider(options);
    case "vscode-lm":
      return new VSCodeLmModelProvider(options);
    case undefined:
    default:
      throw new Error("The selected API provider is not supported");
  }
}
