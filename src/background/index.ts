// ============================================================
// Arcanea Vault — Background Service Worker
// Orchestrates downloads, manages state, handles cross-tab ops
// ============================================================

import { detectPlatform } from '@/core/detector';
import { vault } from '@/core/storage';
import { exportConversation, exportPrompts } from '@/core/exporter';
import type { ExportOptions, DetectionResult } from '@/core/types';

// -- Download Queue --

interface DownloadJob {
  url: string;
  filename: string;
  subfolder?: string;
}

const downloadQueue: DownloadJob[] = [];
let isDownloading = false;

async function processDownloadQueue(): Promise<void> {
  if (isDownloading || downloadQueue.length === 0) return;
  isDownloading = true;

  while (downloadQueue.length > 0) {
    const job = downloadQueue.shift()!;
    const path = job.subfolder
      ? `ArcaneanVault/${job.subfolder}/${job.filename}`
      : `ArcaneanVault/${job.filename}`;

    try {
      await chrome.downloads.download({
        url: job.url,
        filename: path,
        saveAs: false,
      });
    } catch (err) {
      console.error('[Vault] Download failed:', job.filename, err);
    }

    // Rate limit: 300ms between downloads
    await new Promise((r) => setTimeout(r, 300));
  }

  isDownloading = false;
}

function queueDownload(job: DownloadJob): void {
  downloadQueue.push(job);
  processDownloadQueue();
}

// -- Message Handling --

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    handler(message, sender).then(sendResponse);
    return true;
  }
});

type MessageHandler = (
  message: Record<string, unknown>,
  sender: chrome.runtime.MessageSender,
) => Promise<unknown>;

const messageHandlers: Record<string, MessageHandler> = {
  // Content script ready notification
  VAULT_CONTENT_READY: async (message) => {
    console.log(`[Vault] Content script ready: ${message.platform}`);
    return { ok: true };
  },

  // Detect content on current tab
  VAULT_DETECT_TAB: async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) return { error: 'No active tab' };

    const platform = detectPlatform(tab.url);
    if (!platform) return { error: 'Not on a supported AI platform' };

    try {
      const result = await chrome.tabs.sendMessage(tab.id, { type: 'VAULT_DETECT' });
      return result as DetectionResult;
    } catch {
      return { error: `Content script not loaded on ${platform.name}. Refresh the page.` };
    }
  },

  // Download media items
  VAULT_DOWNLOAD_MEDIA: async (message) => {
    const items = message.items as Array<{ url: string; filename: string }>;
    const subfolder = (message.subfolder as string) || 'media';

    for (const item of items) {
      queueDownload({ url: item.url, filename: item.filename, subfolder });
    }

    return { queued: items.length };
  },

  // Export conversation
  VAULT_EXPORT: async (message) => {
    const conversationId = message.conversationId as string;
    const options = message.options as ExportOptions;

    const conv = await vault.getConversation(conversationId);
    if (!conv) return { error: 'Conversation not found in vault' };

    const exported = exportConversation(conv, options);

    // Create blob URL and download
    const blob = new Blob([exported.content], { type: exported.mimeType });
    const url = URL.createObjectURL(blob);

    queueDownload({
      url,
      filename: exported.filename,
      subfolder: 'exports',
    });

    return { filename: exported.filename };
  },

  // Export prompts
  VAULT_EXPORT_PROMPTS: async (message) => {
    const platform = message.platform as string | undefined;
    const format = (message.format as string) || 'json';

    const prompts = await vault.listPrompts(platform as any);
    const exported = exportPrompts(prompts, format as any);

    const blob = new Blob([exported.content], { type: exported.mimeType });
    const url = URL.createObjectURL(blob);

    queueDownload({
      url,
      filename: exported.filename,
      subfolder: 'prompts',
    });

    return { filename: exported.filename, count: prompts.length };
  },

  // Save detected content to vault
  VAULT_SAVE: async (message) => {
    const detection = message.detection as DetectionResult;

    for (const conv of detection.conversations) {
      await vault.saveConversation(conv);
    }
    for (const media of detection.media) {
      await vault.saveMedia(media);
    }
    for (const prompt of detection.prompts) {
      await vault.savePrompt(prompt);
    }

    return {
      saved: {
        conversations: detection.conversations.length,
        media: detection.media.length,
        prompts: detection.prompts.length,
      },
    };
  },

  // Get vault stats
  VAULT_STATS: async () => {
    return vault.getStats();
  },

  // Quick export: detect + save + download in one action
  VAULT_QUICK_EXPORT: async (message) => {
    const options = (message.options as ExportOptions) || {
      format: 'markdown',
      includeMedia: true,
      includeTimestamps: true,
      includeMetadata: false,
      embedMedia: false,
    };

    // Detect
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) return { error: 'No active tab' };

    const platform = detectPlatform(tab.url);
    if (!platform) return { error: 'Not on a supported AI platform' };

    let detection: DetectionResult;
    try {
      detection = await chrome.tabs.sendMessage(tab.id, { type: 'VAULT_DETECT' });
    } catch {
      return { error: `Content script not loaded. Refresh ${platform.name}.` };
    }

    // Save to vault
    for (const conv of detection.conversations) {
      await vault.saveConversation(conv);
    }
    for (const prompt of detection.prompts) {
      await vault.savePrompt(prompt);
    }

    // Export conversations
    for (const conv of detection.conversations) {
      const exported = exportConversation(conv, options);
      const blob = new Blob([exported.content], { type: exported.mimeType });
      const url = URL.createObjectURL(blob);
      queueDownload({ url, filename: exported.filename, subfolder: platform.platform });
    }

    // Queue media downloads
    for (const media of detection.media) {
      queueDownload({
        url: media.hdUrl || media.url,
        filename: media.filename,
        subfolder: `${platform.platform}/media`,
      });
    }

    return {
      platform: platform.platform,
      exported: {
        conversations: detection.conversations.length,
        media: detection.media.length,
        prompts: detection.prompts.length,
      },
    };
  },
};

// -- Extension Icon Badge --

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      const platform = detectPlatform(tab.url);
      if (platform) {
        await chrome.action.setBadgeText({ text: platform.icon, tabId: activeInfo.tabId });
        await chrome.action.setBadgeBackgroundColor({ color: '#8b5cf6', tabId: activeInfo.tabId });
      } else {
        await chrome.action.setBadgeText({ text: '', tabId: activeInfo.tabId });
      }
    }
  } catch {
    // Tab might not exist
  }
});

console.log('[Arcanea Vault] Service worker initialized');
