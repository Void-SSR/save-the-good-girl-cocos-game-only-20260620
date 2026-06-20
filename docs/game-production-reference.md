# 拯救美少女 - 制作参考总表

## 1. 项目基础

- 项目名称：`save-the-good-girl-cocos`
- 显示名称：`拯救美少女`
- 引擎版本：Cocos Creator 3.8.8
- 目标平台：微信小游戏
- 屏幕方向：竖屏
- 当前版本：`0.1.0`
- 工程路径：`/Users/ssr/Documents/游戏制作/save-the-good-girl-cocos-game-only-20260620`

## 2. 游戏定位

这是一个竖屏防线射击 + Boss 净化收集小游戏。

玩家不是普通击杀敌人，而是在污染怪潮中维持净化防线，突破污染源的防御，击败黑化 Boss 的污染形态，最终净化并收录 Boss。

游戏可以参考《向僵尸开炮》的战斗框架：怪潮压境、自动攻击、局内升级、防线失守失败。但本项目必须保持原创题材和包装：黑化美少女 Boss、净化、收录、同伴助战、神秘人主线。

## 3. 核心叙事

神秘人释放污染源。污染源会放大角色内心的执念、创伤、欲望和恐惧，让原本拥有各自背景的美少女黑化成 Boss。

玩家扮演勇者/净化者。战斗胜利不是杀死 Boss，而是打破污染控制，让 Boss 恢复原本意志。被净化的 Boss 会加入玩家阵营，并帮助玩家继续拯救后续角色。

详细叙事规则见：

`docs/narrative-foundation.md`

## 4. 核心循环

1. 大厅展示资源、推荐章节和入口。
2. 玩家选择已解锁章节。
3. 进入竖屏战斗。
4. 污染怪潮持续压向防线。
5. 玩家自动攻击敌人。
6. 击败敌人获得经验。
7. 升级时弹出 3 个净化强化选项。
8. 到达指定时间后 Boss 黑化登场。
9. 击败 Boss 污染形态。
10. 净化成功，Boss 收录为同伴。
11. 发放金币和净化券。
12. 解锁下一章。

## 5. 当前数据内容

### 章节

数据文件：

`assets/resources/data/stages.json`

当前共有 10 章：

1. 霓虹废区 - Boss 绯音
2. 冻结神社 - Boss 白澪
3. 断轨高架 - Boss 岚纱
4. 失控歌剧院 - Boss 薇尔赛
5. 沙暴堡垒 - Boss 赫岚
6. 深海实验所 - Boss 璃深
7. 空城断桥 - Boss 弥拉
8. 午夜赌场 - Boss 洛缇
9. 未来神社 - Boss 夕音
10. 黑钻王座 - Boss 夜凰

每章已经包含：

- `id`
- `name`
- `bossId`
- `danger`
- `theme`
- `durationSec`
- `bossAtSec`
- `baseHp`
- `rewardGold`
- `rewardTicket`
- `description`
- `unlockRequirement`

### Boss

数据文件：

`assets/resources/data/bosses.json`

每个 Boss 当前包含：

- 基础身份
- 年龄
- 所属章节
- 场景
- 服装风格
- 黑化关键词
- 净化关键词
- 背景简介
- 黑化美术提示词
- 净化美术提示词

后续需要补充：

- 黑化前身份细化
- 被污染原因
- 黑化登场台词
- 战斗中台词
- 净化后台词
- 作为同伴时的助战能力
- 与其他 Boss 的剧情关系

### 敌人

数据文件：

`assets/resources/data/enemies.json`

当前敌人：

- 黑雾爬行体：普通怪
- 霓虹疾行怪：快速怪
- 污染重装怪：高血量高伤害怪

### 局内升级

数据文件：

`assets/resources/data/upgrades.json`

当前升级：

- 连射模块：缩短射击间隔
- 净火弹头：提高伤害
- 扇形裂弹：增加副弹
- 霓虹爆裂：追加溅射
- 净化力场：提高防线生命并灼烧前场敌人

## 6. 当前代码结构

### 原型入口

`assets/scripts/cocos/MiniGameEntry.ts`

这是当前最接近可玩原型的入口。它使用 Cocos `Graphics` 和动态 `Label` 绘制：

- 大厅
- 战斗场景
- 敌人
- Boss 血条
- 防线状态
- 升级三选一
- 胜利/失败结算

适合快速迭代原型和验证玩法。

### 战斗模型

`assets/scripts/battle/BattleModel.ts`

包含更标准的战斗逻辑：

- 战斗状态
- 时间推进
- 敌人生成
- 自动射击
- 敌人漏怪扣防线血
- 升级选择
- Boss 出场
- 胜利/失败判定

### 控制器与服务

- `assets/scripts/battle/BattleController.ts`：战斗控制器
- `assets/scripts/battle/EnemySpawner.ts`：敌人权重选择
- `assets/scripts/battle/UpgradeSystem.ts`：升级三选一
- `assets/scripts/core/GameState.ts`：玩家进度和章节解锁
- `assets/scripts/core/SceneRouter.ts`：界面路由
- `assets/scripts/services/SaveService.ts`：存档服务
- `assets/scripts/services/ConfigService.ts`：配置读取服务
- `assets/scripts/platform/WeChatPlatformService.ts`：微信环境包装

### UI 逻辑骨架

- `assets/scripts/ui/LobbyController.ts`
- `assets/scripts/ui/ChapterController.ts`
- `assets/scripts/ui/FormationController.ts`
- `assets/scripts/ui/ResultController.ts`

这些目前是数据/状态逻辑，还没有完整绑定到 Cocos UI Prefab。

## 7. 当前缺口

### 制作缺口

- 正式主场景未完整搭建。
- Prefab 基本为空。
- 美术资源目录基本为空。
- 音频目录基本为空。
- UI 还没有正式组件化。
- Boss 技能还未实现。
- 同伴助战还未实现。
- 章节剧情还没有结构化脚本。
- 图鉴、编组、商城只有逻辑方向，没有完整界面。

### 工程缺口

- `project.config.json` 仍使用 `touristappid`。
- 需要确认 Cocos Dashboard 中打开的项目路径与当前沙箱工程是否一致。
- 需要决定以 `MiniGameEntry.ts` 快速推进，还是把原型迁移到正式控制器架构。

建议短期先用 `MiniGameEntry.ts` 快速做出可玩演示，再逐步拆成正式架构。

## 8. 下一阶段建议

### 第一阶段：确定可玩主线

目标：做出第一章完整体验。

内容：

- 大厅 -> 第一章 -> 战斗 -> Boss -> 净化成功 -> 返回大厅
- 第一章 Boss 绯音拥有完整登场与净化文案
- 通关后收录绯音并解锁第二章

### 第二阶段：补剧情数据结构

新增剧情数据文件，建议：

`assets/resources/data/story.json`

当前第一章剧情数据已建立，并同步到 `assets/data/story.json` 作为制作参考副本。

结构建议：

- 章节开场
- Boss 登场
- Boss 战中台词
- 净化前挣扎
- 净化后对话
- 神秘人线索
- 同伴加入文案

### 第三阶段：同伴助战

被净化 Boss 应该提供助战技能。例如：

- 绯音：提升射速或周期性音波攻击
- 白澪：冰冻前排敌人
- 岚纱：横向冲锋清怪
- 薇尔赛：短时间控制怪潮

### 第四阶段：美术与 UI

优先级：

1. 竖屏战斗背景
2. 主角/防线表现
3. 三类敌人
4. 第一章 Boss 黑化立绘
5. 第一章 Boss 净化立绘
6. 大厅 UI
7. 战斗 HUD
8. 升级卡牌
9. 图鉴与编组占位界面

当前第一章占位资源提示词已建立：

`assets/resources/data/assetPrompts.json`
9. 结算和收录界面

## 9. 文案规则

优先使用：

- 净化
- 黑化
- 污染源
- 污染怪潮
- 防线
- 收录
- 同伴
- 支援
- 解锁
- 神秘人

避免把核心体验写成：

- 杀死 Boss
- 消灭美女
- 击杀女角色

普通怪可以使用击败、清除、突破等词。Boss 应使用净化、唤醒、收录。

## 10. GitHub 状态

浏览器中已经填好 GitHub 新建仓库页面：

- 账号：`Void-SSR`
- 仓库名：`save-the-good-girl-cocos-game-only-20260620`
- 可见性：Public
- README / gitignore / license：未添加

最终创建按钮尚未点击。创建仓库和推送工程需要用户确认。

## 11. 当前实现状态

第一章可玩闭环已在 `assets/scripts/cocos/MiniGameEntry.ts` 中推进：

- 新增 `assets/scenes/HomeScene.scene`，已挂载 `MiniGameEntry` 作为当前原型主场景。
- 大厅可进入第一章净化流程。
- 第一章开场、Boss 登场、胜利后净化对话从 `story.json` 读取。
- Boss 绯音击败后会被净化并收录。
- 通关后记录金币、净化券、第一章通关、第二章解锁、绯音同伴。
- 简版图鉴和编组界面可查看绯音状态。
- 绯音被编组后，重新进入战斗会周期性释放“净化音波”助战。

短期仍建议继续把第一章原型跑稳，再逐步迁移到正式场景和 Prefab 结构。
