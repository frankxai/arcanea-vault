# arcanea-vault — Agent Instructions

Read `CLAUDE.md` first when present. This file is the cross-agent entry point.

## Repo Role

`arcanea-vault` contains Arcanea storage/vault primitives. Treat persistence, migrations, and data contracts as high-risk surfaces.

## Work Pattern

1. Inspect schemas, storage adapters, and package scripts before editing.
2. Preserve backward compatibility for stored data.
3. Add migrations deliberately; do not silently reshape existing data.
4. Do not touch unrelated dirty/untracked files.

## Commands

```bash
pnpm test
pnpm build
git status
```

Run storage-adjacent tests before committing persistence changes.

