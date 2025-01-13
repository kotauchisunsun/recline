import type { Anthropic } from "@anthropic-ai/sdk";

import type { ApiHandlerOptions, ModelInfo, VertexModelId } from "@shared/api";

import type { ModelProvider } from "..";
import type { ApiStream } from "../transform/stream";

import { AnthropicVertex } from "@anthropic-ai/vertex-sdk";

import { vertexDefaultModelId, vertexModels } from "@shared/api";


// https://docs.anthropic.com/en/api/claude-on-vertex-ai
export class VertexModelProvider implements ModelProvider {
  private client: AnthropicVertex;
  private options: ApiHandlerOptions;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new AnthropicVertex({
      projectId: this.options.vertexProjectId,
      // https://cloud.google.com/vertex-ai/generative-ai/docs/partner-models/use-claude#regions
      region: this.options.vertexRegion
    });
  }

  async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
    const model = await this.getModel();
    const stream = await this.client.messages.create({
      model: model.id,
      max_tokens: model.info.maxTokens || 8192,
      temperature: 0,
      system: systemPrompt,
      messages,
      stream: true
    });
    for await (const chunk of stream) {
      switch (chunk.type) {
        case "message_start":
          const usage = chunk.message.usage;
          yield {
            type: "usage",
            inputTokens: usage.input_tokens || 0,
            outputTokens: usage.output_tokens || 0
          };
          break;
        case "message_delta":
          yield {
            type: "usage",
            inputTokens: 0,
            outputTokens: chunk.usage.output_tokens || 0
          };
          break;

        case "content_block_start":
          switch (chunk.content_block.type) {
            case "text":
              if (chunk.index > 0) {
                yield {
                  type: "text",
                  text: "\n"
                };
              }
              yield {
                type: "text",
                text: chunk.content_block.text
              };
              break;
          }
          break;
        case "content_block_delta":
          switch (chunk.delta.type) {
            case "text_delta":
              yield {
                type: "text",
                text: chunk.delta.text
              };
              break;
          }
          break;
      }
    }
  }

  async getModel(): Promise<{ id: VertexModelId; info: ModelInfo }> {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in vertexModels) {
      const id = modelId as VertexModelId;
      return { id, info: vertexModels[id] };
    }
    return { id: vertexDefaultModelId, info: vertexModels[vertexDefaultModelId] };
  }
}
