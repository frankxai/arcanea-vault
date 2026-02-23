// ============================================================
// Arcanea Vault — Popup Controller
// ============================================================

import type { DetectionResult, ExportFormat } from '@/core/types';

// -- DOM Elements --

const $status = document.getElementById('status')!;
const $platform = document.getElementById('platform-name')!;
const $platformIcon = document.getElementById('platform-icon')!;
const $scanBtn = document.getElementById('btn-scan')!;
const $quickExportBtn = document.getElementById('btn-quick-export')!;
const $formatSelect = document.getElementById('format-select') as HTMLSelectElement;

const $results = document.getElementById('results')!;
const $statsConvos = document.getElementById('stat-conversations')!;
const $statsImages = document.getElementById('stat-images')!;
const $statsVideos = document.getElementById('stat-videos')!;
const $statsPrompts = document.getElementById('stat-prompts')!;

const $exportConvos = document.getElementById('btn-export-conversations')!;
const $downloadMedia = document.getElementById('btn-download-media')!;
const $exportPrompts = document.getElementById('btn-export-prompts')!;

const $error = document.getElementById('error')!;
const $unsupported = document.getElementById('unsupported')!;

let lastDetection: DetectionResult | null = null;

// -- Initialization --

async function init(): Promise<void> {
  // Check current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    showUnsupported();
    return;
  }

  // Detect platform
  const result = await sendMessage({ type: 'VAULT_DETECT_TAB' });

  if (result?.error) {
    if (result.error === 'Not on a supported AI platform') {
      showUnsupported();
    } else {
      showError(result.error as string);
    }
    return;
  }

  if (result?.platform) {
    lastDetection = result as DetectionResult;
    showDetection(lastDetection);
  }
}

function showDetection(detection: DetectionResult): void {
  $unsupported.classList.add('hidden');
  $error.classList.add('hidden');
  $results.classList.remove('hidden');

  const platformNames: Record<string, string> = {
    grok: 'Grok',
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    deepseek: 'DeepSeek',
    perplexity: 'Perplexity',
  };

  $platform.textContent = platformNames[detection.platform] || detection.platform;
  $platformIcon.textContent = getPlatformIcon(detection.platform);
  $status.textContent = 'Content detected';
  $status.className = 'status-success';

  $statsConvos.textContent = String(detection.stats.totalConversations);
  $statsImages.textContent = String(detection.stats.totalImages);
  $statsVideos.textContent = String(detection.stats.totalVideos);
  $statsPrompts.textContent = String(detection.stats.totalPrompts);

  // Enable/disable action buttons based on content
  toggleBtn($exportConvos, detection.stats.totalConversations > 0);
  toggleBtn($downloadMedia, detection.stats.totalImages + detection.stats.totalVideos > 0);
  toggleBtn($exportPrompts, detection.stats.totalPrompts > 0);
}

function showUnsupported(): void {
  $unsupported.classList.remove('hidden');
  $results.classList.add('hidden');
  $error.classList.add('hidden');
  $status.textContent = 'Navigate to an AI platform';
  $status.className = 'status-muted';
}

function showError(message: string): void {
  $error.classList.remove('hidden');
  $error.textContent = message;
  $results.classList.add('hidden');
  $unsupported.classList.add('hidden');
}

// -- Actions --

$scanBtn.addEventListener('click', async () => {
  $scanBtn.setAttribute('disabled', 'true');
  $status.textContent = 'Scanning...';
  $status.className = 'status-scanning';

  const result = await sendMessage({ type: 'VAULT_DETECT_TAB' });

  $scanBtn.removeAttribute('disabled');

  if (result?.error) {
    showError(result.error as string);
    return;
  }

  if (result?.platform) {
    lastDetection = result as DetectionResult;

    // Save to vault
    await sendMessage({ type: 'VAULT_SAVE', detection: lastDetection });

    showDetection(lastDetection);
  }
});

$quickExportBtn.addEventListener('click', async () => {
  $quickExportBtn.setAttribute('disabled', 'true');
  $status.textContent = 'Exporting...';

  const format = $formatSelect.value as ExportFormat;

  const result = await sendMessage({
    type: 'VAULT_QUICK_EXPORT',
    options: {
      format,
      includeMedia: true,
      includeTimestamps: true,
      includeMetadata: false,
      embedMedia: false,
    },
  });

  $quickExportBtn.removeAttribute('disabled');

  if (result?.error) {
    showError(result.error as string);
    return;
  }

  const exported = result?.exported as Record<string, number>;
  $status.textContent = `Exported: ${exported?.conversations || 0} convos, ${exported?.media || 0} media, ${exported?.prompts || 0} prompts`;
  $status.className = 'status-success';
});

$exportConvos.addEventListener('click', async () => {
  if (!lastDetection) return;

  const format = $formatSelect.value as ExportFormat;

  // Save first, then export
  await sendMessage({ type: 'VAULT_SAVE', detection: lastDetection });

  for (const conv of lastDetection.conversations) {
    await sendMessage({
      type: 'VAULT_EXPORT',
      conversationId: conv.id,
      options: {
        format,
        includeMedia: true,
        includeTimestamps: true,
        includeMetadata: false,
        embedMedia: false,
      },
    });
  }

  $status.textContent = `Exported ${lastDetection.conversations.length} conversation(s)`;
  $status.className = 'status-success';
});

$downloadMedia.addEventListener('click', async () => {
  if (!lastDetection) return;

  const items = lastDetection.media.map((m) => ({
    url: m.hdUrl || m.url,
    filename: m.filename,
  }));

  await sendMessage({
    type: 'VAULT_DOWNLOAD_MEDIA',
    items,
    subfolder: `${lastDetection.platform}/media`,
  });

  $status.textContent = `Downloading ${items.length} media file(s)...`;
  $status.className = 'status-scanning';
});

$exportPrompts.addEventListener('click', async () => {
  if (!lastDetection) return;

  await sendMessage({ type: 'VAULT_SAVE', detection: lastDetection });

  const format = $formatSelect.value as ExportFormat;
  await sendMessage({
    type: 'VAULT_EXPORT_PROMPTS',
    platform: lastDetection.platform,
    format,
  });

  $status.textContent = `Exported ${lastDetection.prompts.length} prompt(s)`;
  $status.className = 'status-success';
});

// -- Utilities --

function sendMessage(msg: Record<string, unknown>): Promise<Record<string, unknown>> {
  return chrome.runtime.sendMessage(msg);
}

function toggleBtn(el: HTMLElement, enabled: boolean): void {
  if (enabled) {
    el.removeAttribute('disabled');
    el.classList.remove('opacity-40');
  } else {
    el.setAttribute('disabled', 'true');
    el.classList.add('opacity-40');
  }
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    grok: '\ud835\udd4f', // 𝕏
    chatgpt: '\u25d0',     // ◐
    claude: '\u25c8',      // ◈
    gemini: '\u2726',      // ✦
    deepseek: '\u25c7',    // ◇
    perplexity: '\u2295',  // ⊕
  };
  return icons[platform] || '?';
}

// -- Boot --

init();
