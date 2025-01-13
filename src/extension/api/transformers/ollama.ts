import type { Message } from "ollama";

import type { MessageParamWithTokenCount } from "@shared/api";

import { Transformer } from "../transformer";


export abstract class OllamaTransformer extends Transformer<Message> {

  public static toExternalMessages(messages: MessageParamWithTokenCount[]): Message[] {
    throw new Error("Method not implemented.");
  }

  public static toInternalMessages(messages: Message[]): MessageParamWithTokenCount[] {
    throw new Error("Method not implemented.");
  }
}
