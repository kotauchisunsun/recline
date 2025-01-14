import type { ChatMessageData } from "@lmstudio/sdk";

import type { MessageParamWithTokenCount } from "@shared/api";

import { Transformer } from "../transformer";


export abstract class LMStudioTransformer extends Transformer<ChatMessageData> {

  public static toExternalMessages(internalMessages: MessageParamWithTokenCount[]): ChatMessageData[] {
    throw new Error("Method not implemented.");
  }

  public static toInternalMessages(externalMessages: ChatMessageData[]): MessageParamWithTokenCount[] {
    throw new Error("Method not implemented.");
  }
}
