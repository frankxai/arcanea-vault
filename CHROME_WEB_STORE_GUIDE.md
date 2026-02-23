# Arcanea Vault - Chrome Web Store Submission Guide

> Everything you need to publish Arcanea Vault to the Chrome Web Store.
> The extension is built and ready in `dist/`.

---

## Step 1: Create a Chrome Web Store Developer Account

1. Go to: https://chrome.google.com/webstore/devconsole/register
2. Sign in with your Google account
3. Pay the **one-time $5 registration fee**
4. Accept the Developer Agreement

---

## Step 2: Test the Extension Locally First

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the folder: `C:\Users\frank\arcanea-vault\dist`
5. The extension should appear with the Vault icon
6. Navigate to https://grok.com, https://chatgpt.com, or https://claude.ai
7. Click the extension icon in the toolbar
8. Verify it detects the platform and shows content stats
9. Try "Quick Export All" to test the export functionality

---

## Step 3: Prepare Store Assets

You need these assets before submitting:

### Required Images
| Asset | Size | Notes |
|-------|------|-------|
| Extension icon | 128x128 px | Already in `icons/icon-128.png` (replace with final design) |
| Small promo tile | 440x280 px | Store listing tile |
| Screenshots | 1280x800 or 640x400 | At least 1, recommend 5 |

### Recommended: Create Screenshots
Take screenshots on these platforms for maximum SEO value:
1. **Grok** - Show the popup detecting Grok Imagine images
2. **ChatGPT** - Show conversation export in Markdown
3. **Claude** - Show artifact detection
4. **Gemini** - Show image capture
5. **Multi-platform** - Show the "unsupported" state with all platform chips

### Store Listing Text

**Extension Name** (already set in manifest):
```
Arcanea Vault - ChatGPT, Claude, Grok, Gemini Export
```

**Short Description** (132 chars max):
```
Export conversations, images & prompts from ChatGPT, Claude, Grok, Gemini, DeepSeek & Perplexity to Markdown, JSON, PDF.
```

**Detailed Description** (for store listing):
```
Arcanea Vault captures and exports your AI conversations, generated images, videos, and prompts from all major AI platforms.

SUPPORTED PLATFORMS:
- ChatGPT (including DALL-E images)
- Claude (including artifacts)
- Grok (including Imagine images & videos)
- Google Gemini (including generated images)
- DeepSeek
- Perplexity

EXPORT FORMATS:
- Markdown (.md) - Perfect for Obsidian, Notion, GitHub
- JSON - Structured data for developers
- HTML - Beautifully styled offline viewing
- Plain Text - Universal compatibility

KEY FEATURES:
- One-click Quick Export: Captures everything on the page instantly
- Smart Detection: Automatically identifies conversations, images, videos, and prompts
- Local-first: All data stays on your device. No cloud. No tracking.
- Organized Downloads: Files saved to ArcaneanVault/ folder with platform subfolders
- Side Panel Library: Browse your captured content (v0.2.0)

PERFECT FOR:
- Researchers archiving AI conversations
- Creators saving generated images and prompts
- Developers documenting AI interactions
- Writers collecting AI-assisted content
- Anyone who wants to keep their AI creations organized

FREE & PRIVACY-FIRST:
No account required. No data collection. No analytics. Your conversations stay yours.

Built by Arcanea (arcanea.ai) - Imagine a Good Future. Build It Here.
```

**Category**: Productivity

**Language**: English

---

## Step 4: Create the ZIP Package

Open PowerShell and run:
```powershell
cd C:\Users\frank\arcanea-vault
Compress-Archive -Path dist\* -DestinationPath arcanea-vault-v0.1.0.zip -Force
```

This creates `arcanea-vault-v0.1.0.zip` ready for upload.

---

## Step 5: Submit to Chrome Web Store

1. Go to: https://chrome.google.com/webstore/devconsole
2. Click **"New Item"** (+ button)
3. Upload `arcanea-vault-v0.1.0.zip`
4. Fill in the store listing:
   - **Name**: Arcanea Vault - ChatGPT, Claude, Grok, Gemini Export
   - **Description**: (use the detailed description above)
   - **Category**: Productivity
   - **Language**: English
5. Upload screenshots and promo images
6. Set **Visibility**: Public
7. Set **Distribution**: All regions

### Privacy Practices (required):
- **Single purpose description**: "Export and download conversations, images, and prompts from AI platforms"
- **Host permissions justification**: "Required to detect and extract content from supported AI platforms (ChatGPT, Claude, Grok, Gemini, DeepSeek, Perplexity)"
- **Data usage**: "No data collected. All processing happens locally in the browser."
- **Remote code**: No
- **Personal data**: No

8. Click **"Submit for Review"**

---

## Step 6: Review Process

- **Typical review time**: 1-3 business days
- **Common rejection reasons**:
  - Missing privacy policy (add a simple one at arcanea.ai/privacy)
  - Screenshots don't match functionality
  - Description mentions features not yet implemented

### If Privacy Policy Required
Create a simple page at `arcanea.ai/vault/privacy` with:
- We don't collect any data
- All processing is local
- No analytics, tracking, or cookies
- Contact: frank@arcanea.ai

---

## Quick Checklist

- [ ] Developer account created ($5 fee paid)
- [ ] Extension tested locally via `chrome://extensions/`
- [ ] Tested on at least 2 platforms (Grok + ChatGPT recommended)
- [ ] ZIP file created from `dist/`
- [ ] 5 screenshots captured (1280x800)
- [ ] 440x280 promo tile created
- [ ] Final 128px icon designed (replace placeholder)
- [ ] Privacy policy page published
- [ ] Store listing submitted
- [ ] Review approved

---

## Post-Launch SEO Tips

1. **Keywords in description**: ChatGPT export, Grok download, Claude export, AI conversation saver, prompt exporter
2. **Reply to reviews**: Increases trust and ranking
3. **Regular updates**: New version every 2-4 weeks keeps ranking fresh
4. **Blog post**: Write "How to Export ChatGPT Conversations" linking to the extension

---

*Generated by Arcanea Intelligence OS*
