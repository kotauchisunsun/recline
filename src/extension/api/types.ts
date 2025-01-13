export interface Model {

  id: string;

  outputLimit?: number;
  contextWindow: number;

  supportsImages: boolean;
  supportsPromptCache: boolean;

  inputPrice?: number;
  outputPrice?: number;
  cacheWritesPrice?: number;
  cacheReadsPrice?: number;
}

export interface ProviderResponseStreamTextChunk {
  type: "text";
  content: string;
}

export interface ProviderResponseStreamImageChunk {
  type: "image";
  content: unknown;
  contentType: string;
}

export interface ProviderResponseStreamUsageChunk {
  type: "usage";
  inputTokenCount: number;
  outputTokenCount: number;
}

export type ProviderResponseStreamChunk = ProviderResponseStreamTextChunk | ProviderResponseStreamImageChunk | ProviderResponseStreamUsageChunk;

export type ProviderResponseStream = AsyncGenerator<ProviderResponseStreamChunk>;
