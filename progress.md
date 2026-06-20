Original prompt: Implement the full production plan for 《拯救美少女》, starting with a first-chapter playable loop, placeholder assets/prompts, and MiniGameEntry prototype expansion.

## 2026-06-20

- Started implementation from the approved plan.
- Baseline direction: first chapter playable loop first, placeholder asset prompts, continue with `MiniGameEntry.ts`.
- GitHub public upload still needs action-time confirmation before pushing project files.
- Added first-chapter story data in `assets/resources/data/story.json` and mirrored it under `assets/data/story.json`.
- Added first-chapter placeholder art prompt data in `assetPrompts.json`.
- Extended game types with story, companion skill, viewed story nodes, and battle companion snapshot fields.
- Expanded `MiniGameEntry.ts` into a first-chapter loop with story screens, persistent progress, codex, formation, Hiyin unlock, and companion assist.
- Replaced in-game first-chapter wording that mentioned eliminating Hiyin with purification-focused wording.
