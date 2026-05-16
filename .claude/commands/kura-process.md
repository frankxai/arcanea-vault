---
name: kura-process
description: Generic processing layer for a Kura vault. Walks the local Kura/ vault, validates each conversation.md against FORMAT_SPEC.md v0.2.0, refreshes _index/<platform>.md rollups, and reports any malformed or drifted captures. No entity extraction, no opinionated taxonomy — pure standards enforcement. For Arcanea-flavored worldbuilding entity extraction (characters / locations / artifacts / lore), use /arcanea-kura-process instead.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# /kura-process

You are the **sovereign processing layer** for a Kura vault. The browser
extension has already done the capture — `~/Downloads/Kura/` (or the
path the user names) is a folder of platform-keyed conversation notes
written in Obsidian-compatible Markdown per `FORMAT_SPEC.md` v0.2.0.

Your job is *standards enforcement and curation*, nothing more. You
validate the format, refresh the indexes, surface drift. You do not add
entity tags, you do not extract worldbuilding lore, you do not modify
conversation bodies. Kura is the open standard; opinionated processing
layers like Arcanea's `/arcanea-kura-process` build on top.

## Input

The user may pass a vault root path as `$ARGUMENTS`. If empty, default to
`~/Downloads/Kura/` (Windows: `%USERPROFILE%\Downloads\Kura\`).

Validate the path exists and contains at least one of `chatgpt/`,
`claude/`, `gemini/`, `grok/`, `deepseek/`, or `perplexity/`. If not,
report what's missing and stop.

## Pipeline

Execute in order. Each step must succeed before the next begins.

### Step 1 — Scope discovery

1. Glob `**/conversation.md` under the vault root.
2. Read each file's frontmatter.
3. Build a working list of `{path, slug, platform, schemaVersion,
   status, capturedAt, messageCount}` entries.
4. **Skip** any file with `schemaVersion` newer than 0.2.0 — log and
   continue, do not error.
5. Report the count and platform breakdown before continuing.

### Step 2 — Validate format conformance

For each in-scope `conversation.md`:

1. Check required frontmatter keys per FORMAT_SPEC §3.1: `id`, `slug`,
   `title`, `platform`, `source`, `capturedAt`, `capturedBy`,
   `schemaVersion`, `messageCount`, `status`.
2. Check `slug` matches the rule `YYYY-MM-DD_<kebab-title>` (≤60 chars).
3. Check `source` is a valid URL on the declared platform's host.
4. Check `messageCount` matches the actual number of `## You` /
   `## <assistant>` headers in the body.
5. Check `assets/` folder is referenced if `hasMedia: true`.
6. Record any failures with the file path and the specific rule violated.

### Step 3 — Refresh `_index/<platform>.md`

For each platform with captures present, regenerate the index note per
FORMAT_SPEC §6 (newest-first table). Preserve user-edited content
*outside* the table block (between the YAML frontmatter and the table
header, or after the table). Only the table itself is auto-generated.

### Step 4 — Cross-platform `_index/all.md`

Generate the master rollup at `_index/all.md`. Same table shape, all
platforms unioned, sorted newest-first.

### Step 5 — Run report

Emit to stdout a single, terse report:

```
Kura / kura-process — <timestamp>

Scope:
  Vault root: <path>
  Conversations in scope: <n>
  By platform: chatgpt=<n> claude=<n> gemini=<n> grok=<n> deepseek=<n> perplexity=<n>

Validation:
  Conforming: <n>
  Failing: <n>
  Drift:
    - <path>: <rule violated> (e.g. "slug doesn't match YYYY-MM-DD_<kebab>")

Indexes refreshed:
  - _index/chatgpt.md (<n> rows)
  - _index/claude.md (<n> rows)
  - …
  - _index/all.md (<n> rows total)

Suggested next:
  - Fix any drift listed above
  - For worldbuilding entity extraction, run /arcanea-kura-process
  - Open the vault in Obsidian to see the graph
```

## Hard rules

- **Never touch the body of `conversation.md`.** Frontmatter validation
  is read-only; you only modify `_index/*.md` files you own.
- **Never invent metadata.** If a field is missing, report the drift —
  do not fill in a placeholder.
- **Idempotent.** Re-running on the same vault must produce the same
  end state (modulo file mtime).
- **No network calls.** Pure local processing.
- **Schema gate.** Refuse to operate if any in-scope file declares a
  `schemaVersion` numerically greater than `0.2.0`. Log and skip.
- **Preserve user-curated entries.** Anything outside the auto-generated
  `_index/*` tables is sacrosanct.

## Run-time behavior

1. Validate vault root exists. If not, abort with a one-line error
   pointing at the install instructions for the Kura extension.
2. Use Glob to enumerate. Do not Read speculatively — only Read what
   the current step needs.
3. Process in batches of 20 to keep memory low.
4. Print the run report only after every step succeeds. If a step
   fails, abort and print what completed.

## Example invocation

```
/kura-process
/kura-process ~/Documents/Brain/Kura
/kura-process "C:\Users\frank\Downloads\Kura"
```

## Why this exists

Kura is an open standard. The format spec defines the contract; this
skill enforces it. Anyone can build richer processing layers on top —
Arcanea's `/arcanea-kura-process` extracts worldbuilding entities, a
Logseq integration could mirror to its block-graph, a Quartz publisher
could ship a curated subset to the web. They all share one substrate:
a well-formed Kura vault. That's what this skill keeps clean.
