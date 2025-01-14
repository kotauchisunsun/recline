import type { MessageParamWithTokenCount } from "@shared/api";


export abstract class Transformer<T> {
  public abstract toExternalMessages(internalMessages: MessageParamWithTokenCount[]): T[];
  public abstract toInternalMessages(externalMessages: T[]): MessageParamWithTokenCount[];
}
