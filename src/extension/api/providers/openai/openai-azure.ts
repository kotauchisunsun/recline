import type { Model } from "@extension/api/types";

import type { OpenAICompatibleModelProviderConfig } from "./openai-compatible";

import { AzureOpenAI } from "openai";

import { OpenAICompatibleModelProvider } from "./openai-compatible";


export interface OpenAIAzureModelProviderConfig extends OpenAICompatibleModelProviderConfig {}

export class OpenAIAzureModelProvider extends OpenAICompatibleModelProvider<OpenAIAzureModelProviderConfig> {
  protected override readonly client: AzureOpenAI;

  constructor(options: Record<string, unknown>) {
    super("OpenAI Azure", options);
    this.client = new AzureOpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.apiBaseURL
    });
  }

  async getAllModels(): Promise<Model[]> {
    return [
      {
        id: "o1",
        outputLimit: 100_000,
        contextWindow: 200_000,
        supportsImages: true,
        supportsPromptCache: false, // TODO: ...
        inputPrice: 0, // TODO: ...
        outputPrice: 0 // TODO: ...
      },
      {
        id: "o1-preview",
        outputLimit: 32_768,
        contextWindow: 128_000,
        supportsImages: true,
        supportsPromptCache: false,
        inputPrice: 0, // TODO: ...
        outputPrice: 0 // TODO: ...
      },
      {
        id: "o1-mini",
        outputLimit: 65_536,
        contextWindow: 128_000,
        supportsImages: true,
        supportsPromptCache: false,
        inputPrice: 0, // TODO: ...
        outputPrice: 0 // TODO: ...
      }
    ];
  }
}
