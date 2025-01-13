import type * as vscode from "vscode";

import type { MessageParamWithTokenCount } from "@shared/api";

import { isEqual } from "es-toolkit";

import { Transformer } from "../transformer";


export const SELECTOR_SEPARATOR: string = " / ";

export abstract class VSCodeLMMessageTransformer extends Transformer<vscode.LanguageModelChatMessage> {

  public static parseSelector(stringifiedSelector: string): vscode.LanguageModelChatSelector {
    if (!stringifiedSelector.includes(SELECTOR_SEPARATOR)) {
      return { id: stringifiedSelector };
    }

    const parts: string[] = stringifiedSelector.split(SELECTOR_SEPARATOR);
    if (parts.length !== 2) {
      return { id: stringifiedSelector };
    }

    return { vendor: parts[0], family: parts[1] };
  }

  public static selectorIsEqual(a: any, b: any): boolean {
    return isEqual(a, b);
  }

  public static stringifySelector(selector: vscode.LanguageModelChatSelector): string | null {
    if (
      (selector.vendor == null || selector.vendor.length === 0)
      || (selector.family == null || selector.family.length === 0)
    ) {

      if (selector.id == null || selector.id.length === 0) {
        return null;
      }

      return selector.id;
    }

    return `${selector.vendor}${SELECTOR_SEPARATOR}${selector.family}`;
  }

  public static toExternalMessages(messages: MessageParamWithTokenCount[]): vscode.LanguageModelChatMessage[] {

    // TODO: IMPLEMENT
    return [];
  }

  public static toInternalMessages(messages: vscode.LanguageModelChatMessage[]): MessageParamWithTokenCount[] {

    // TODO: IMPLEMENT
    return [];
  }
}
