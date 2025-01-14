import type Anthropic from "@anthropic-ai/sdk";

import type { MessageParamWithTokenCount } from "@shared/api";

import * as vscode from "vscode";
import { isEqual } from "es-toolkit";

import { asObjectSafe } from "@shared/utils/object";

import { Transformer } from "../transformer";


export const SELECTOR_SEPARATOR: string = " / ";

export abstract class VSCodeLMMessageTransformer extends Transformer<vscode.LanguageModelChatMessage> {

  public static convertToAnthropicRole(
    vsCodeLmMessageRole: vscode.LanguageModelChatMessageRole
  ): string | null {

    return vsCodeLmMessageRole === vscode.LanguageModelChatMessageRole.Assistant
      ? "assistant"
      : (
        vsCodeLmMessageRole === vscode.LanguageModelChatMessageRole.User
          ? "user"
          : null
      );
  }

  public static parseAssistantContentParts(
    parts: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolUseBlockParam | Anthropic.DocumentBlockParam)[]
  ): (vscode.LanguageModelToolCallPart | vscode.LanguageModelTextPart)[] {

    const contentParts: (vscode.LanguageModelToolCallPart | vscode.LanguageModelTextPart)[] = [];

    for (const part of parts) {

      switch (part.type) {

        case "tool_use": {
          contentParts.push(
            new vscode.LanguageModelToolCallPart(
              part.id,
              part.name,
              asObjectSafe(part.input)
            )
          );
          break;
        }

        case "text": {
          contentParts.push(
            new vscode.LanguageModelTextPart(
              part.text
            )
          );
          break;
        }

        case "image": {
          contentParts.push(
            new vscode.LanguageModelTextPart(
              `[Image (${part.source?.type || ""}): ${part.source?.media_type || ""}]`
            )
          );
          break;
        }

        case "document": {
          contentParts.push(
            new vscode.LanguageModelTextPart(
              `[Document (${part.source?.type || ""}): ${part.source?.media_type || ""}]`
            )
          );
          break;
        }
      }
    }

    return contentParts;
  }

  public static parseSelector(
    stringifiedSelector: string
  ): vscode.LanguageModelChatSelector {

    if (!stringifiedSelector.includes(SELECTOR_SEPARATOR)) {
      return { id: stringifiedSelector };
    }

    const parts: string[] = stringifiedSelector.split(SELECTOR_SEPARATOR);

    if (parts.length !== 2) {
      return { id: stringifiedSelector };
    }

    return { vendor: parts[0], family: parts[1] };
  }

  public static parseUserContentParts(
    parts: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolResultBlockParam | Anthropic.DocumentBlockParam)[]
  ): (vscode.LanguageModelToolResultPart | vscode.LanguageModelTextPart)[] {

    const contentParts: (vscode.LanguageModelToolResultPart | vscode.LanguageModelTextPart)[] = [];

    for (const part of parts) {

      switch (part.type) {

        case "text": {
          contentParts.push(
            new vscode.LanguageModelTextPart(
              part.text
            )
          );
          break;
        }

        case "tool_result": {
          if (typeof part.content === "string") {
            contentParts.push(
              new vscode.LanguageModelTextPart(
                part.content
              )
            );
            continue;
          }

          const contentArr = (part.content || [])
            .map(sub =>
              sub.type === "image"
                ? new vscode.LanguageModelTextPart(`[Image (${sub.source?.type || ""}): ${sub.source?.media_type || ""}]`)
                : new vscode.LanguageModelTextPart(sub.text)
            );

          contentParts.push(
            new vscode.LanguageModelToolResultPart(
              part.tool_use_id,
              contentArr
            )
          );
          break;
        }

        case "image": {
          contentParts.push(
            new vscode.LanguageModelTextPart(
              `[Image (${part.source?.type || ""}): ${part.source?.media_type || ""}]`
            )
          );
          break;
        }

        case "document": {
          contentParts.push(
            new vscode.LanguageModelTextPart(
              `[Document (${part.source?.type || ""}): ${part.source?.media_type || ""}]`
            )
          );
        }
      }
    }
    return contentParts;
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

  public static toExternalMessages(internalMessages: MessageParamWithTokenCount[]): vscode.LanguageModelChatMessage[] {

    const vsCodeLmMessages: vscode.LanguageModelChatMessage[] = [];

    for (const internalMessage of internalMessages) {

      if (typeof internalMessage.content === "string") {
        vsCodeLmMessages.push(
          internalMessage.role === "assistant"
            ? vscode.LanguageModelChatMessage.Assistant(internalMessage.content)
            : vscode.LanguageModelChatMessage.User(internalMessage.content)
        );
        continue;
      }

      switch (internalMessage.role) {

        case "user": {
          vsCodeLmMessages.push(
            vscode.LanguageModelChatMessage.User(
              VSCodeLMMessageTransformer.parseUserContentParts(
                internalMessage.content.filter(
                  // Users can never invoke tools
                  part => part.type !== "tool_use"
                )
              )
            )
          );
          break;
        }

        case "assistant": {
          vsCodeLmMessages.push(
            vscode.LanguageModelChatMessage.Assistant(
              VSCodeLMMessageTransformer.parseAssistantContentParts(
                internalMessage.content.filter(
                  // Assistants can never return tool results
                  part => part.type !== "tool_result"
                )
              )
            )
          );
          break;
        }
      }
    }

    return vsCodeLmMessages;
  }

  public static toInternalMessages(_externalMessages: vscode.LanguageModelChatMessage[]): MessageParamWithTokenCount[] {

    // TODO: IMPLEMENT
    return [];
  }
}
