import type { ZodSchema } from "zod";

import type { MessageParamWithTokenCount } from "@shared/api";

import type { Model, ProviderResponseStream } from "./types";

import { z } from "zod";


export interface ModelProviderConfig {
  modelId?: string; // Providers could potentially lack model selection capabilities.
}

export abstract class ModelProvider<TConfig extends ModelProviderConfig> {

  protected readonly config: z.infer<ReturnType<this["getConfigSchema"]>>;

  protected constructor(public readonly name: string, config: Record<string, unknown>) {
    this.config = this.getConfigSchema().parse(config);
  }

  abstract createResponseStream(systemPrompt: string, messages: MessageParamWithTokenCount[]): ProviderResponseStream;
  abstract getAllModels(): Promise<Model[]>;

  getConfigSchema(): ZodSchema<TConfig> {
    return z.object({
      modelId: z.string().trim().nonempty().optional()
    }) as ZodSchema<TConfig>;
  }

  abstract getCurrentModel(): Promise<Model>;
}
