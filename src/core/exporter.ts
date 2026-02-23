// ============================================================
// Arcanea Vault — Export Engine
// Convert captured content to any format.
// ============================================================

import type {
  Conversation,
  MediaItem,
  PromptItem,
  ExportFormat,
  ExportOptions,
} from './types';

/** Export a conversation to the specified format */
export function exportConversation(
  conv: Conversation,
  options: ExportOptions,
): { content: string; filename: string; mimeType: string } {
  switch (options.format) {
    case 'markdown':
      return exportToMarkdown(conv, options);
    case 'json':
      return exportToJson(conv);
    case 'html':
      return exportToHtml(conv, options);
    case 'txt':
      return exportToText(conv);
    default:
      return exportToMarkdown(conv, options);
  }
}

function exportToMarkdown(
  conv: Conversation,
  options: ExportOptions,
): { content: string; filename: string; mimeType: string } {
  const lines: string[] = [];

  lines.push(`# ${conv.title}`);
  lines.push('');
  lines.push(`**Platform:** ${conv.platform}`);
  lines.push(`**URL:** ${conv.url}`);
  if (options.includeTimestamps) {
    lines.push(`**Captured:** ${conv.capturedAt}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  for (const msg of conv.messages) {
    const role = msg.role === 'user' ? '**You**' : '**Assistant**';
    if (options.includeTimestamps && msg.timestamp) {
      lines.push(`${role} *(${msg.timestamp})*`);
    } else {
      lines.push(role);
    }
    lines.push('');
    lines.push(msg.content);
    lines.push('');

    if (options.includeMedia && msg.attachments?.length) {
      for (const att of msg.attachments) {
        if (att.type === 'image') {
          lines.push(`![${att.filename || 'image'}](${att.url})`);
        } else if (att.type === 'code') {
          lines.push('```');
          lines.push(att.url);
          lines.push('```');
        }
        lines.push('');
      }
    }

    lines.push('---');
    lines.push('');
  }

  lines.push('');
  lines.push('*Exported with [Arcanea Vault](https://arcanea.ai/vault)*');

  const filename = `${sanitize(conv.title)}_${conv.platform}.md`;

  return {
    content: lines.join('\n'),
    filename,
    mimeType: 'text/markdown',
  };
}

function exportToJson(
  conv: Conversation,
): { content: string; filename: string; mimeType: string } {
  const filename = `${sanitize(conv.title)}_${conv.platform}.json`;
  return {
    content: JSON.stringify(conv, null, 2),
    filename,
    mimeType: 'application/json',
  };
}

function exportToHtml(
  conv: Conversation,
  options: ExportOptions,
): { content: string; filename: string; mimeType: string } {
  const messages = conv.messages
    .map((msg) => {
      const roleClass = msg.role === 'user' ? 'user' : 'assistant';
      const roleLabel = msg.role === 'user' ? 'You' : 'Assistant';
      const timestamp =
        options.includeTimestamps && msg.timestamp
          ? `<span class="timestamp">${msg.timestamp}</span>`
          : '';
      return `<div class="message ${roleClass}">
        <div class="role">${roleLabel} ${timestamp}</div>
        <div class="content">${escapeHtml(msg.content)}</div>
      </div>`;
    })
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(conv.title)} — Arcanea Vault</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; background: #0a0a0f; color: #e4e4ed; }
    h1 { color: #8b5cf6; }
    .meta { color: #64648a; margin-bottom: 2rem; }
    .message { margin: 1.5rem 0; padding: 1rem; border-radius: 8px; }
    .message.user { background: #1a1a2e; border-left: 3px solid #8b5cf6; }
    .message.assistant { background: #12121a; border-left: 3px solid #7fffd4; }
    .role { font-weight: 700; margin-bottom: 0.5rem; }
    .user .role { color: #8b5cf6; }
    .assistant .role { color: #7fffd4; }
    .timestamp { font-weight: 400; font-size: 0.85rem; color: #64648a; }
    .content { white-space: pre-wrap; line-height: 1.6; }
    .footer { margin-top: 3rem; color: #64648a; font-size: 0.85rem; text-align: center; }
    .footer a { color: #8b5cf6; }
  </style>
</head>
<body>
  <h1>${escapeHtml(conv.title)}</h1>
  <div class="meta">
    <p>Platform: ${conv.platform} | Captured: ${conv.capturedAt}</p>
    <p>Source: <a href="${conv.url}">${conv.url}</a></p>
  </div>
  ${messages}
  <div class="footer">
    Exported with <a href="https://arcanea.ai/vault">Arcanea Vault</a>
  </div>
</body>
</html>`;

  const filename = `${sanitize(conv.title)}_${conv.platform}.html`;
  return { content: html, filename, mimeType: 'text/html' };
}

function exportToText(
  conv: Conversation,
): { content: string; filename: string; mimeType: string } {
  const lines: string[] = [];
  lines.push(conv.title);
  lines.push(`Platform: ${conv.platform}`);
  lines.push(`URL: ${conv.url}`);
  lines.push('');

  for (const msg of conv.messages) {
    const role = msg.role === 'user' ? 'You' : 'Assistant';
    lines.push(`[${role}]`);
    lines.push(msg.content);
    lines.push('');
  }

  const filename = `${sanitize(conv.title)}_${conv.platform}.txt`;
  return { content: lines.join('\n'), filename, mimeType: 'text/plain' };
}

/** Export prompts as a collection */
export function exportPrompts(
  prompts: PromptItem[],
  format: ExportFormat = 'json',
): { content: string; filename: string; mimeType: string } {
  const filename = `prompts_${Date.now()}`;

  if (format === 'markdown') {
    const lines = prompts.map((p, i) => `## Prompt ${i + 1}\n\n${p.text}\n`);
    return {
      content: `# Prompt Archive\n\n${lines.join('\n---\n\n')}`,
      filename: `${filename}.md`,
      mimeType: 'text/markdown',
    };
  }

  return {
    content: JSON.stringify(prompts, null, 2),
    filename: `${filename}.json`,
    mimeType: 'application/json',
  };
}

function sanitize(name: string): string {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 100);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
