# Codex Game Production Context

## Project

This is a Cocos Creator 3.8.8 WeChat mini game project named `save-the-good-girl-cocos`.

Game title: `拯救美少女`.

Primary project path:

`/Users/ssr/Documents/游戏制作/save-the-good-girl-cocos-game-only-20260620`

## Core Direction

Build a vertical mobile mini game inspired by the battle structure of games like `向僵尸开炮`, but with original narrative, characters, and systems.

The player is a brave purifier. A mysterious person released a pollution source that corrupts women with strong personal stories into dark Boss forms. The player defeats the pollution form, purifies the Boss, and recruits her as a companion. Purified companions should later help rescue other corrupted Bosses.

Avoid treating Bosses as enemies to kill. Use `净化`, `黑化`, `污染`, `收录`, `同伴`, `支援`, and `解锁` as the main language.

## Must-Read Files

Before major story, gameplay, UI, or content work, read:

- `docs/narrative-foundation.md`
- `docs/game-production-reference.md`
- `assets/resources/data/stages.json`
- `assets/resources/data/bosses.json`
- `assets/resources/data/enemies.json`
- `assets/resources/data/upgrades.json`
- `assets/scripts/cocos/MiniGameEntry.ts`
- `assets/scripts/battle/BattleModel.ts`
- `assets/scripts/data/GameTypes.ts`

## Current Implementation Shape

There are two useful layers:

1. `assets/scripts/cocos/MiniGameEntry.ts`
   - Direct Cocos component prototype.
   - Draws lobby, battle, upgrade, victory, and defeat UI through `Graphics` and generated `Label` nodes.
   - Useful for immediate playable prototype work.

2. `assets/scripts/*`
   - Cleaner gameplay architecture.
   - Includes battle model, controllers, save service, config service, state, routing, and UI controller skeletons.
   - Useful for long-term maintainable implementation.

## Production Rules

- Keep the game vertical and mobile-first.
- Keep the core loop: lobby -> chapter -> battle -> upgrade choices -> Boss -> purification result -> companion unlock.
- Boss corruption must come from each character's background, weakness, obsession, trauma, or unstable will.
- Every purified Boss should become a collectible and eventually a usable companion.
- The mysterious person must leave traces across chapters.
- Do not introduce unrelated refactors unless needed for the next production step.
- Prefer Cocos Creator 3.8.8-compatible TypeScript.
- Keep content data in JSON where possible so story, balancing, and UI can use the same source.

## Immediate Gaps

- Formal scene and prefab binding are incomplete.
- Most texture and audio directories only contain `.gitkeep`.
- The current prototype is mostly generated graphics, not final UI art.
- Boss skills are not implemented.
- Companion assist gameplay is only planned, not implemented.
- Chapter story scripts and purified dialogue are not yet structured in data.
- WeChat build configuration still uses `touristappid`.
