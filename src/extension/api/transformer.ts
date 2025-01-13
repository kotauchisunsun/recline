import type { MessageParamWithTokenCount } from "@shared/api";


export abstract class Transformer<T> {
  public abstract toExternalMessages(messages: MessageParamWithTokenCount[]): T[];
  public abstract toInternalMessages(messages: T[]): MessageParamWithTokenCount[];
}
