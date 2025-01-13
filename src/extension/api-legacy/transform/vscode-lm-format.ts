import type { Anthropic } from "@anthropic-ai/sdk";

import * as crypto from "node:crypto";

import * as vscode from "vscode";


function asObjectSafe(value: any): object {
  if (value == null)
    return {};
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    }
    catch {
      return {};
    }
  }
  if (typeof value === "object") {
    return { ...value };
  }
  return {};
}

// Helper to parse user message parts
function parseUserContentParts(
  parts: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolResultBlockParam)[]
): (vscode.LanguageModelToolResultPart | vscode.LanguageModelTextPart)[] {
  const contentParts: (vscode.LanguageModelToolResultPart | vscode.LanguageModelTextPart)[] = [];
  for (const part of parts) {
    if (part.type === "tool_result") {
      const contentArr = (part.content || []).map(sub =>
        sub.type === "image"
          ? new vscode.LanguageModelTextPart(`[Image (${sub.source?.type || ""}): ${sub.source?.media_type || ""}]`)
          : new vscode.LanguageModelTextPart(sub.text)
      );
      contentParts.push(new vscode.LanguageModelToolResultPart(part.tool_use_id, contentArr));
    }
    else if (part.type === "image") {
      contentParts.push(new vscode.LanguageModelTextPart(`[Image (${part.source?.type || ""}): ${part.source?.media_type || ""}]`));
    }
    else if (part.type === "text") {
      contentParts.push(new vscode.LanguageModelTextPart(part.text));
    }
  }
  return contentParts;
}

// Helper to parse assistant message parts
function parseAssistantContentParts(
  parts: (Anthropic.TextBlockParam | Anthropic.ImageBlockParam | Anthropic.ToolUseBlockParam)[]
): (vscode.LanguageModelToolCallPart | vscode.LanguageModelTextPart)[] {
  const contentParts: (vscode.LanguageModelToolCallPart | vscode.LanguageModelTextPart)[] = [];
  for (const part of parts) {
    if (part.type === "tool_use") {
      contentParts.push(new vscode.LanguageModelToolCallPart(part.id, part.name, asObjectSafe(part.input)));
    }
    else if (part.type === "text") {
      contentParts.push(new vscode.LanguageModelTextPart(part.text));
    }
  }
  return contentParts;
}

// Converts Anthropic messages to VSCode Language Model chat messages
export function convertToVsCodeLmMessages(anthropicMessages: Anthropic.Messages.MessageParam[]): vscode.LanguageModelChatMessage[] {
  const vsCodeLmMessages: vscode.LanguageModelChatMessage[] = [];
  for (const anthropicMessage of anthropicMessages) {
    if (typeof anthropicMessage.content === "string") {
      vsCodeLmMessages.push(
        anthropicMessage.role === "assistant"
          ? vscode.LanguageModelChatMessage.Assistant(anthropicMessage.content)
          : vscode.LanguageModelChatMessage.User(anthropicMessage.content)
      );
      continue;
    }
    switch (anthropicMessage.role) {
      case "user":
        const userParts = parseUserContentParts(anthropicMessage.content.filter(part => part.type !== "tool_use"));
        vsCodeLmMessages.push(vscode.LanguageModelChatMessage.User(userParts));
        break;
      case "assistant":
        const assistantParts = parseAssistantContentParts(anthropicMessage.content.filter(part => part.type !== "tool_result"));
        vsCodeLmMessages.push(vscode.LanguageModelChatMessage.Assistant(assistantParts));
        break;
    }
  }
  return vsCodeLmMessages;
}

// Converts VSCode message role to Anthropic role
export function convertToAnthropicRole(vsCodeLmMessageRole: vscode.LanguageModelChatMessageRole): string | null {
  return vsCodeLmMessageRole === vscode.LanguageModelChatMessageRole.Assistant
    ? "assistant"
    : vsCodeLmMessageRole === vscode.LanguageModelChatMessageRole.User
      ? "user"
      : null;
}

// Converts VSCode message to Anthropic message format. Currently not used.
// export async function convertToAnthropicMessage(vsCodeLmMessage: vscode.LanguageModelChatMessage): Promise<Anthropic.Messages.Message> {
//   const anthropicRole = convertToAnthropicRole(vsCodeLmMessage.role);
//   if (anthropicRole !== "assistant") {
//     throw new Error("Recline <Language Model API>: Only assistant messages are supported.");
//   }
//   const content = vsCodeLmMessage.content.map((part) => {
//     if (part instanceof vscode.LanguageModelTextPart) {
//       return { type: "text", text: part.value };
//     }
//     if (part instanceof vscode.LanguageModelToolCallPart) {
//       return {
//         type: "tool_use",
//         id: part.callId || crypto.randomUUID(),
//         name: part.name,
//         input: asObjectSafe(part.input)
//       };
//     }
//     return null;
//   }).filter(part => part !== null) as Anthropic.ContentBlock[];
//   return {
//     id: crypto.randomUUID(),
//     type: "message",
//     model: "vscode-lm",
//     role: anthropicRole,
//     content,
//     stop_reason: null,
//     stop_sequence: null,
//     usage: {
//       input_tokens: (vsCodeLmMessage as any).__tokenCount?.inputTokens || 0,
//       output_tokens: (vsCodeLmMessage as any).__tokenCount?.outputTokens || 0
//     }
//   };
// }
