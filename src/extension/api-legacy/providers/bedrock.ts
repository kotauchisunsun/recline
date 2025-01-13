import type { Anthropic } from "@anthropic-ai/sdk";

import type { ApiHandlerOptions, BedrockModelId, ModelInfo } from "@shared/api";

import type { ModelProvider } from "..";
import type { ApiStream } from "../transform/stream";

import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";

import { bedrockDefaultModelId, bedrockModels } from "@shared/api";


// https://docs.anthropic.com/en/api/claude-on-amazon-bedrock
export class BedrockModelProvider implements ModelProvider {
  private client: AnthropicBedrock;
  private options: ApiHandlerOptions;

  constructor(options: ApiHandlerOptions) {
    this.options = options;
    this.client = new AnthropicBedrock({
      // Authenticate by either providing the keys below or use the default AWS credential providers, such as
      // using ~/.aws/credentials or the "AWS_SECRET_ACCESS_KEY" and "AWS_ACCESS_KEY_ID" environment variables.
      ...(this.options.awsAccessKey ? { awsAccessKey: this.options.awsAccessKey } : {}),
      ...(this.options.awsSecretKey ? { awsSecretKey: this.options.awsSecretKey } : {}),
      ...(this.options.awsSessionToken ? { awsSessionToken: this.options.awsSessionToken } : {}),

      // awsRegion changes the aws region to which the request is made. By default, we read AWS_REGION,
      // and if that's not present, we default to us-east-1. Note that we do not read ~/.aws/config for the region.
      awsRegion: this.options.awsRegion
    });
  }

  async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
    // cross region inference requires prefixing the model id with the region
    const model = await this.getModel();
    let modelId: string;
    if (this.options.awsUseCrossRegionInference) {
      const regionPrefix = (this.options.awsRegion || "").slice(0, 3);
      switch (regionPrefix) {
        case "us-":
          modelId = `us.${model.id}`;
          break;
        case "eu-":
          modelId = `eu.${model.id}`;
          break;
        default:
          // cross region inference is not supported in this region, falling back to default model
          modelId = model.id;
          break;
      }
    }
    else {
      modelId = model.id;
    }

    const stream = await this.client.messages.create({
      model: modelId,
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

  async getModel(): Promise<{ id: string; info: ModelInfo }> {
    const modelId = this.options.apiModelId;
    if (modelId && modelId in bedrockModels) {
      const id = modelId as BedrockModelId;
      return { id, info: bedrockModels[id] };
    }
    return { id: bedrockDefaultModelId, info: bedrockModels[bedrockDefaultModelId] };
  }
}
