import {
  _decorator,
  Color,
  Component,
  EventKeyboard,
  EventTouch,
  Graphics,
  Input,
  JsonAsset,
  KeyCode,
  Label,
  Node,
  UITransform,
  Vec3,
  input,
  resources,
} from "cc";
import type { ChapterStoryConfig, PlayerProgress, StoryConfigBundle } from "../data/GameTypes";

const { ccclass, property } = _decorator;

type Mode = "lobby" | "story" | "battle" | "upgrade" | "victory" | "defeat" | "codex" | "formation";
type StoryAfter = "startBattle" | "resumeBattle" | "lobby";

interface RuntimeEnemy {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  xp: number;
  radius: number;
  kind: "crawler" | "runner" | "brute";
}

interface RuntimeBoss {
  hp: number;
  maxHp: number;
}

interface UpgradeChoice {
  id: string;
  name: string;
  desc: string;
}

const SAVE_KEY = "save_the_good_girl_minigame_progress_v1";
const FIRST_STAGE_ID = 1;
const FIRST_BOSS_ID = "hiyin";
const FIRST_BOSS_NAME = "绯音";
const FIRST_STAGE_REWARD_GOLD = 260;
const FIRST_STAGE_REWARD_TICKET = 1;
const COMPANION_COOLDOWN_SEC = 8;

const DEFAULT_PROGRESS: PlayerProgress = {
  gold: 0,
  tickets: 0,
  clearedStages: [],
  purifiedBosses: [],
  selectedCompanionId: null,
  lastStageId: 1,
  viewedStoryNodes: [],
};

const FALLBACK_STORY: ChapterStoryConfig = {
  stageId: 1,
  bossId: FIRST_BOSS_ID,
  opening: [
    "霓虹废区的地下舞台突然复亮，污染音束把整片演出区变成了黑化领域。",
    "绯音曾经害怕被观众遗忘。神秘人利用这份恐惧，让她相信只有支配舞台，才不会再次失去光芒。",
    "勇者抵达净化防线。目标不是压制绯音，而是击破污染源对她的控制。",
  ],
  bossEntrance: [
    "黑化·绯音登场。",
    "她的歌声混入污染频率，怪潮开始为她的舞台让路。",
    "净化核心已锁定：击破舞台支配污染，唤醒真正的绯音。",
  ],
  battleLines: ["不要把目光从我身上移开。", "只要舞台还在，我就不会再被遗忘。", "这些掌声，全部都必须属于我。"],
  purification: [
    "污染音束被净化弹幕撕开，绯音眼中的黑色光晕开始褪去。",
    "她终于听见了真正的掌声，也想起自己最初登上舞台，并不是为了支配任何人。",
    "绯音恢复理智，并愿意用自己的歌声支援勇者。",
  ],
  companionJoin: ["绯音已收录为同伴。", "同伴助战解锁：净化音波。战斗中会周期性释放音波，清除前线污染。"],
  mysteryHint: [
    "废弃控制台上残留一段加密讯息：第一位样本已被回收观察，下一处冻结神社即将开启。",
    "神秘人并没有离开。他似乎在等待勇者继续前进。",
  ],
};

const UPGRADES: UpgradeChoice[] = [
  { id: "rapid-fire", name: "连射模块", desc: "射击间隔 -15%" },
  { id: "hot-round", name: "净火弹头", desc: "净化伤害 +22%" },
  { id: "split-shot", name: "扇形裂弹", desc: "副弹 +1" },
  { id: "neon-bomb", name: "霓虹爆裂", desc: "命中追加范围净化" },
  { id: "purify-field", name: "净化力场", desc: "防线 +20，前场灼烧" },
];

@ccclass("MiniGameEntry")
export class MiniGameEntry extends Component {
  @property
  public designWidth = 750;

  @property
  public designHeight = 1334;

  private graphics!: Graphics;
  private labelLayer!: Node;
  private mode: Mode = "lobby";
  private progress: PlayerProgress = { ...DEFAULT_PROGRESS };
  private stageStory: ChapterStoryConfig = FALLBACK_STORY;
  private storyTitle = "";
  private storyLines: string[] = [];
  private storyIndex = 0;
  private storyAfter: StoryAfter = "lobby";
  private storyNodeId = "";
  private timeSec = 0;
  private baseHp = 100;
  private level = 1;
  private xp = 0;
  private xpToNext = 30;
  private purifiedCount = 0;
  private fireTimer = 0;
  private spawnTimer = 0;
  private damage = 58;
  private fireInterval = 0.28;
  private extraShots = 0;
  private splashRatio = 0;
  private fieldDps = 0;
  private companionCooldown = 0;
  private assistFlashSec = 0;
  private enemies: RuntimeEnemy[] = [];
  private boss: RuntimeBoss | null = null;
  private bossIntroShown = false;
  private upgradeChoices: UpgradeChoice[] = [];
  private loadedStageData = false;
  private loadedStoryData = false;

  onLoad(): void {
    this.ensureCanvasSize();
    this.graphics = this.node.getComponent(Graphics) ?? this.node.addComponent(Graphics);
    this.labelLayer = new Node("GeneratedLabels");
    this.node.addChild(this.labelLayer);
    this.loadProgress();
    input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.loadResourceData();
  }

  onDestroy(): void {
    input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
  }

  start(): void {
    this.render();
  }

  update(deltaTime: number): void {
    if (this.mode === "battle") {
      this.stepBattle(Math.min(deltaTime, 1 / 20));
    }
    this.render();
  }

  private ensureCanvasSize(): void {
    const transform = this.node.getComponent(UITransform) ?? this.node.addComponent(UITransform);
    transform.setContentSize(this.designWidth, this.designHeight);
  }

  private loadResourceData(): void {
    resources.load("data/stages", JsonAsset, (error) => {
      this.loadedStageData = !error;
    });

    resources.load("data/story", JsonAsset, (error, asset) => {
      if (!error && asset?.json) {
        const bundle = asset.json as StoryConfigBundle;
        this.stageStory = bundle.chapters.find((item) => item.stageId === FIRST_STAGE_ID) ?? FALLBACK_STORY;
      }
      this.loadedStoryData = !error;
    });
  }

  private onKeyDown(event: EventKeyboard): void {
    if (event.keyCode === KeyCode.SPACE || event.keyCode === KeyCode.ENTER) {
      this.primaryAction();
      return;
    }
    if (event.keyCode === KeyCode.DIGIT_1) this.chooseUpgrade(0);
    if (event.keyCode === KeyCode.DIGIT_2) this.chooseUpgrade(1);
    if (event.keyCode === KeyCode.DIGIT_3) this.chooseUpgrade(2);
  }

  private onTouchStart(event: EventTouch): void {
    const transform = this.node.getComponent(UITransform);
    const point = event.getUILocation();
    const local = transform
      ? transform.convertToNodeSpaceAR(new Vec3(point.x, point.y, 0))
      : new Vec3(point.x - this.designWidth / 2, point.y - this.designHeight / 2, 0);
    this.handlePointer(local.x, local.y);
  }

  private handlePointer(x: number, y: number): void {
    if (this.mode === "story") {
      this.advanceStory();
      return;
    }

    if (this.mode === "lobby") {
      if (this.hit(x, y, -224, 244, 448, 78) || this.hit(x, y, -305, 40, 290, 132)) {
        this.beginStory("第一章 · 霓虹废区", this.stageStory.opening, "startBattle", "stage-1-opening");
        return;
      }
      if (this.hit(x, y, 15, 40, 290, 132)) {
        this.mode = "formation";
        return;
      }
      if (this.hit(x, y, -305, -120, 290, 132)) {
        this.mode = "codex";
        return;
      }
      return;
    }

    if (this.mode === "formation") {
      if (this.hit(x, y, -322, -606, 220, 58)) {
        this.mode = "lobby";
        return;
      }
      if (this.hit(x, y, -292, 148, 584, 110) && this.isBossPurified(FIRST_BOSS_ID)) {
        this.progress.selectedCompanionId = FIRST_BOSS_ID;
        this.saveProgress();
      }
      return;
    }

    if (this.mode === "codex") {
      if (this.hit(x, y, -322, -606, 220, 58)) {
        this.mode = "lobby";
      }
      return;
    }

    if (this.mode === "upgrade") {
      this.upgradeChoices.forEach((_, index) => {
        const cardY = 190 - index * 92;
        if (this.hit(x, y, -280, cardY, 560, 68)) {
          this.chooseUpgrade(index);
        }
      });
      return;
    }

    if (this.mode === "victory" || this.mode === "defeat") {
      this.primaryAction();
    }
  }

  private hit(x: number, y: number, left: number, bottom: number, width: number, height: number): boolean {
    return x >= left && x <= left + width && y >= bottom && y <= bottom + height;
  }

  private primaryAction(): void {
    if (this.mode === "lobby") {
      this.beginStory("第一章 · 霓虹废区", this.stageStory.opening, "startBattle", "stage-1-opening");
      return;
    }
    if (this.mode === "story") {
      this.advanceStory();
      return;
    }
    if (this.mode === "victory") {
      this.beginStory(
        "净化完成 · 绯音收录",
        [...this.stageStory.purification, ...this.stageStory.companionJoin, ...this.stageStory.mysteryHint],
        "lobby",
        "stage-1-victory"
      );
      return;
    }
    if (this.mode === "defeat" || this.mode === "codex" || this.mode === "formation") {
      this.mode = "lobby";
    }
  }

  private beginStory(title: string, lines: string[], after: StoryAfter, nodeId: string): void {
    this.storyTitle = title;
    this.storyLines = lines.length > 0 ? lines : ["污染通讯短暂中断，净化行动继续。"];
    this.storyIndex = 0;
    this.storyAfter = after;
    this.storyNodeId = nodeId;
    this.mode = "story";
  }

  private advanceStory(): void {
    if (this.storyIndex < this.storyLines.length - 1) {
      this.storyIndex += 1;
      return;
    }

    if (this.storyNodeId && !this.progress.viewedStoryNodes.includes(this.storyNodeId)) {
      this.progress.viewedStoryNodes.push(this.storyNodeId);
      this.saveProgress();
    }

    if (this.storyAfter === "startBattle") {
      this.startBattle();
      return;
    }
    if (this.storyAfter === "resumeBattle") {
      this.mode = "battle";
      return;
    }
    this.mode = "lobby";
  }

  private startBattle(): void {
    this.mode = "battle";
    this.timeSec = 0;
    this.baseHp = 100;
    this.level = 1;
    this.xp = 0;
    this.xpToNext = 30;
    this.purifiedCount = 0;
    this.fireTimer = 0;
    this.spawnTimer = 0;
    this.damage = 58;
    this.fireInterval = 0.28;
    this.extraShots = 0;
    this.splashRatio = 0;
    this.fieldDps = 0;
    this.companionCooldown = this.hasSelectedCompanion() ? 4 : 0;
    this.assistFlashSec = 0;
    this.enemies = [];
    this.boss = null;
    this.bossIntroShown = false;
    this.upgradeChoices = [];
  }

  private stepBattle(deltaSec: number): void {
    this.timeSec += deltaSec;
    this.fireTimer -= deltaSec;
    this.spawnTimer -= deltaSec;
    this.assistFlashSec = Math.max(0, this.assistFlashSec - deltaSec);

    if (this.hasSelectedCompanion()) {
      this.companionCooldown -= deltaSec;
      if (this.companionCooldown <= 0) {
        this.triggerCompanionAssist();
        this.companionCooldown = COMPANION_COOLDOWN_SEC;
      }
    }

    if (this.spawnTimer <= 0 && !this.boss) {
      this.spawnEnemy();
      this.spawnTimer = Math.max(0.36, 1.0 - this.timeSec / 160);
    }

    if (!this.boss && this.timeSec >= 42) {
      this.boss = { hp: 4800, maxHp: 4800 };
      if (!this.bossIntroShown) {
        this.bossIntroShown = true;
        this.beginStory("黑化 Boss 登场", this.stageStory.bossEntrance, "resumeBattle", "stage-1-boss");
        return;
      }
    }

    for (const enemy of this.enemies) {
      enemy.y -= enemy.speed * deltaSec;
      if (this.fieldDps > 0 && enemy.y < -190) {
        enemy.hp -= this.fieldDps * deltaSec;
      }
      if (enemy.y <= -510) {
        this.baseHp -= enemy.damage;
        enemy.hp = 0;
      }
    }

    if (this.fireTimer <= 0) {
      this.shoot();
      this.fireTimer = this.fireInterval;
    }

    this.collectDeadEnemies();

    if (this.baseHp <= 0) {
      this.baseHp = 0;
      this.mode = "defeat";
    }

    if (this.boss && this.boss.hp <= 0) {
      this.boss.hp = 0;
      this.completeFirstStage();
      this.mode = "victory";
    }
  }

  private spawnEnemy(): void {
    const selector = this.purifiedCount % 7 === 0 ? "brute" : this.purifiedCount % 3 === 0 ? "runner" : "crawler";
    const hp = selector === "brute" ? 180 : selector === "runner" ? 54 : 74;
    this.enemies.push({
      kind: selector,
      x: -290 + ((this.purifiedCount * 73 + Math.floor(this.timeSec * 19)) % 580),
      y: 720,
      hp,
      maxHp: hp,
      speed: selector === "runner" ? 132 : selector === "brute" ? 56 : 84,
      damage: selector === "brute" ? 10 : 4,
      xp: selector === "brute" ? 28 : 12,
      radius: selector === "brute" ? 30 : 22,
    });
  }

  private shoot(): void {
    const shots = 1 + this.extraShots;
    for (let index = 0; index < shots; index += 1) {
      this.enemies.sort((a, b) => a.y - b.y);
      const target = this.enemies[0];
      if (target) {
        target.hp -= this.damage;
        if (this.splashRatio > 0) {
          for (const enemy of this.enemies) {
            if (enemy !== target && Math.abs(enemy.y - target.y) <= 86) {
              enemy.hp -= this.damage * this.splashRatio;
            }
          }
        }
        continue;
      }
      if (this.boss) {
        this.boss.hp -= this.damage * 0.72;
      }
    }
  }

  private triggerCompanionAssist(): void {
    this.assistFlashSec = 1.2;
    for (const enemy of this.enemies) {
      enemy.hp -= 120;
    }
    if (this.boss) {
      this.boss.hp -= 320;
    }
  }

  private collectDeadEnemies(): void {
    const dead = this.enemies.filter((enemy) => enemy.hp <= 0 && enemy.y > -510);
    this.enemies = this.enemies.filter((enemy) => enemy.hp > 0);
    for (const enemy of dead) {
      this.purifiedCount += 1;
      this.xp += enemy.xp;
    }
    if (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext += 18;
      this.upgradeChoices = [0, 1, 2].map((offset) => UPGRADES[(this.level + offset) % UPGRADES.length]);
      this.mode = "upgrade";
    }
  }

  private chooseUpgrade(index: number): void {
    if (this.mode !== "upgrade") return;
    const choice = this.upgradeChoices[index];
    if (!choice) return;
    if (choice.id === "rapid-fire") this.fireInterval *= 0.85;
    if (choice.id === "hot-round") this.damage *= 1.22;
    if (choice.id === "split-shot") this.extraShots += 1;
    if (choice.id === "neon-bomb") this.splashRatio = Math.max(this.splashRatio, 0.34);
    if (choice.id === "purify-field") {
      this.baseHp += 20;
      this.fieldDps = Math.max(this.fieldDps, 8);
    }
    this.upgradeChoices = [];
    this.mode = "battle";
  }

  private completeFirstStage(): void {
    const firstClear = !this.progress.clearedStages.includes(FIRST_STAGE_ID);
    if (firstClear) {
      this.progress.clearedStages.push(FIRST_STAGE_ID);
      this.progress.gold += FIRST_STAGE_REWARD_GOLD;
      this.progress.tickets += FIRST_STAGE_REWARD_TICKET;
      this.progress.lastStageId = 2;
    }
    if (!this.progress.purifiedBosses.includes(FIRST_BOSS_ID)) {
      this.progress.purifiedBosses.push(FIRST_BOSS_ID);
    }
    if (!this.progress.selectedCompanionId) {
      this.progress.selectedCompanionId = FIRST_BOSS_ID;
    }
    this.saveProgress();
  }

  private render(): void {
    this.clearLabels();
    const g = this.graphics;
    g.clear();
    this.drawBackground(g);
    this.drawTopHud(g);

    if (this.mode === "lobby") this.drawLobby(g);
    if (this.mode === "formation") this.drawFormation(g);
    if (this.mode === "codex") this.drawCodex(g);
    if (this.mode === "battle" || this.mode === "upgrade" || this.mode === "victory" || this.mode === "defeat") this.drawBattle(g);
    if (this.mode === "story") {
      if (this.storyAfter === "resumeBattle") this.drawBattle(g);
      else this.drawLobby(g);
      this.drawStoryOverlay(g);
    }
    if (this.mode === "upgrade") this.drawUpgradeOverlay(g);
    if (this.mode === "victory" || this.mode === "defeat") this.drawResultOverlay(g);
  }

  private drawBackground(g: Graphics): void {
    g.fillColor = new Color(7, 10, 18, 255);
    g.rect(-375, -667, 750, 1334);
    g.fill();

    g.fillColor = new Color(32, 13, 46, 255);
    g.roundRect(-330, -600, 660, 1180, 30);
    g.fill();

    g.strokeColor = new Color(109, 240, 255, 62);
    g.lineWidth = 4;
    for (let i = 0; i < 9; i += 1) {
      const y = -470 + i * 110 + ((this.timeSec * 60) % 110);
      g.moveTo(-300, y);
      g.lineTo(300, y + 48);
      g.stroke();
    }

    g.strokeColor = new Color(255, 74, 156, 40);
    g.lineWidth = 3;
    for (let i = 0; i < 5; i += 1) {
      const x = -330 + i * 165;
      g.moveTo(x, -600);
      g.lineTo(x + 60, 580);
      g.stroke();
    }
  }

  private drawTopHud(g: Graphics): void {
    this.panel(g, -340, 562, 680, 76, new Color(8, 14, 26, 224));
    this.text(`金币 ${this.progress.gold}`, -310, 600, 23, new Color(255, 209, 138));
    this.text(`净化券 ${this.progress.tickets}`, -160, 600, 23, new Color(255, 209, 138));
    const status = this.loadedStageData && this.loadedStoryData ? "数据已加载" : "数据加载中";
    this.text(status, 154, 600, 22, new Color(109, 240, 255));
  }

  private drawLobby(g: Graphics): void {
    this.panel(g, -305, 300, 610, 230, new Color(16, 25, 43, 246));
    this.text("拯救美少女", -250, 488, 48, Color.WHITE);
    this.text("第一章 · 霓虹废区", -250, 420, 32, new Color(255, 209, 138));
    this.paragraph("神秘人释放污染源，黑化绯音锁定废弃舞台。勇者需要突破污染怪潮，完成净化与收录。", -250, 370, 21, new Color(220, 238, 255), 24, 28);
    this.panel(g, -224, 244, 448, 78, new Color(255, 74, 156, 238));
    this.text(this.isStageCleared(FIRST_STAGE_ID) ? "再次净化演练" : "开始净化行动", -126, 292, 32, Color.WHITE);

    this.panel(g, -305, 40, 290, 132, new Color(22, 31, 52, 246));
    this.panel(g, 15, 40, 290, 132, new Color(22, 31, 52, 246));
    this.panel(g, -305, -120, 290, 132, new Color(22, 31, 52, 246));
    this.panel(g, 15, -120, 290, 132, new Color(22, 31, 52, 180));
    this.text("章节", -270, 126, 32, new Color(255, 209, 138));
    this.text(this.isStageCleared(FIRST_STAGE_ID) ? "第2章 已解锁" : "第1章 进行中", -270, 86, 21, Color.WHITE);
    this.text("编组", 50, 126, 32, new Color(255, 209, 138));
    this.text(this.hasSelectedCompanion() ? "绯音助战中" : "通关后解锁", 50, 86, 21, Color.WHITE);
    this.text("图鉴", -270, -34, 32, new Color(255, 209, 138));
    this.text(this.isBossPurified(FIRST_BOSS_ID) ? "绯音 已收录" : "绯音 未净化", -270, -74, 21, Color.WHITE);
    this.text("商城", 50, -34, 32, new Color(120, 139, 160));
    this.text("后续开放", 50, -74, 21, new Color(150, 163, 184));

    this.panel(g, -305, -300, 610, 132, new Color(8, 14, 26, 214));
    this.text("制作状态", -270, -218, 28, new Color(109, 240, 255));
    this.paragraph("当前目标：第一章可玩闭环。已接入剧情数据、收录进度、简版图鉴、编组和绯音助战。", -270, -260, 20, new Color(220, 238, 255), 30, 25);
  }

  private drawFormation(g: Graphics): void {
    this.panel(g, -320, 230, 640, 300, new Color(16, 25, 43, 248));
    this.text("同伴编组", -270, 482, 42, Color.WHITE);
    this.paragraph("被净化的 Boss 会成为同伴。选择同伴后，她会在战斗中提供助战。", -270, 420, 22, new Color(220, 238, 255), 28, 30);

    const unlocked = this.isBossPurified(FIRST_BOSS_ID);
    this.panel(g, -292, 148, 584, 110, unlocked ? new Color(34, 49, 82, 248) : new Color(24, 31, 44, 220));
    this.text(unlocked ? "绯音 · 净化音波" : "绯音 · 未收录", -250, 220, 28, unlocked ? new Color(255, 209, 138) : new Color(148, 163, 184));
    this.text(unlocked ? "周期性释放音波，清除前线污染。" : "通关第一章后解锁同伴助战。", -250, 184, 21, Color.WHITE);
    this.text(this.progress.selectedCompanionId === FIRST_BOSS_ID ? "已编组" : "点击编组", 160, 184, 22, new Color(109, 240, 255));

    this.backButton(g);
  }

  private drawCodex(g: Graphics): void {
    this.panel(g, -320, 100, 640, 430, new Color(16, 25, 43, 248));
    this.text("净化图鉴", -270, 482, 42, Color.WHITE);
    this.text("已净化 Boss 会在这里收录，并逐步加入后续剧情。", -270, 426, 22, new Color(220, 238, 255));

    this.codexRow(g, -270, 330, "绯音", "霓虹废区", this.isBossPurified(FIRST_BOSS_ID));
    this.codexRow(g, -270, 254, "白澪", "冻结神社", false, this.isStageCleared(FIRST_STAGE_ID) ? "线索已解锁" : "未解锁");
    this.codexRow(g, -270, 178, "岚纱", "断轨高架", false);
    this.codexRow(g, -270, 102, "薇尔赛", "失控歌剧院", false);

    this.backButton(g);
  }

  private codexRow(g: Graphics, x: number, y: number, name: string, scene: string, purified: boolean, note = "未净化"): void {
    this.panel(g, x, y, 540, 58, purified ? new Color(34, 49, 82, 248) : new Color(24, 31, 44, 214));
    this.text(`${name} · ${scene}`, x + 22, y + 38, 23, purified ? new Color(255, 209, 138) : new Color(203, 213, 225));
    this.text(purified ? "已收录" : note, x + 394, y + 38, 20, purified ? new Color(109, 240, 255) : new Color(148, 163, 184));
  }

  private drawBattle(g: Graphics): void {
    if (this.boss) {
      this.text("BOSS 黑化·绯音", -166, 518, 32, new Color(255, 92, 168));
      this.bar(g, -265, 486, 530, 18, this.boss.hp / this.boss.maxHp, new Color(255, 79, 159));
      this.text("污染控制强度", -68, 470, 18, new Color(255, 209, 138));
    }

    for (const enemy of this.enemies) {
      g.fillColor = enemy.kind === "brute" ? new Color(255, 139, 88) : enemy.kind === "runner" ? new Color(109, 240, 255) : new Color(154, 255, 211);
      g.circle(enemy.x, enemy.y, enemy.radius);
      g.fill();
      this.bar(g, enemy.x - 28, enemy.y + enemy.radius + 8, 56, 6, enemy.hp / enemy.maxHp, new Color(255, 92, 122));
    }

    if (this.assistFlashSec > 0) {
      g.strokeColor = new Color(255, 209, 138, 190);
      g.lineWidth = 8;
      g.circle(0, -120, 300 - this.assistFlashSec * 80);
      g.stroke();
      this.text("绯音 · 净化音波", -116, -120, 28, new Color(255, 209, 138));
    }

    g.fillColor = new Color(216, 244, 255);
    g.roundRect(-50, -530, 100, 74, 24);
    g.fill();
    this.text("勇者", -31, -488, 26, new Color(17, 24, 39));

    this.panel(g, -340, -624, 680, 72, new Color(8, 14, 26, 226));
    this.text(`防线 ${Math.ceil(this.baseHp)}`, -312, -580, 21, Color.WHITE);
    this.text(`Lv.${this.level}`, -168, -580, 21, Color.WHITE);
    this.text(`净化 ${this.purifiedCount}`, -74, -580, 21, Color.WHITE);
    this.text(`${Math.floor(this.timeSec)}s`, 60, -580, 21, Color.WHITE);
    const assistText = this.hasSelectedCompanion() ? `绯音 ${Math.ceil(Math.max(0, this.companionCooldown))}s` : "无同伴";
    this.text(assistText, 154, -580, 21, new Color(109, 240, 255));
  }

  private drawUpgradeOverlay(g: Graphics): void {
    this.panel(g, -320, -40, 640, 390, new Color(7, 10, 18, 246));
    this.text("净化强化", -86, 285, 38, new Color(255, 209, 138));
    this.upgradeChoices.forEach((choice, index) => {
      const y = 190 - index * 92;
      this.panel(g, -280, y, 560, 68, new Color(20, 33, 58, 255));
      this.text(`${index + 1}. ${choice.name}`, -250, y + 40, 26, Color.WHITE);
      this.text(choice.desc, 70, y + 40, 20, new Color(210, 228, 244));
    });
  }

  private drawResultOverlay(g: Graphics): void {
    this.panel(g, -312, -44, 624, 360, new Color(7, 10, 18, 248));
    const success = this.mode === "victory";
    this.text(success ? "净化成功" : "防线失守", -120, 230, 46, success ? new Color(255, 209, 138) : new Color(255, 106, 124));
    this.paragraph(
      success ? "绯音已从污染音束中醒来，并收录为同伴。点击继续查看净化对话与下一章线索。" : "污染怪潮突破防线。返回大厅后可以重新挑战第一章。",
      -250,
      150,
      24,
      Color.WHITE,
      22,
      31
    );
    this.text(success ? "点击继续" : "点击返回大厅", -78, 44, 24, new Color(109, 240, 255));
  }

  private drawStoryOverlay(g: Graphics): void {
    this.panel(g, -330, -340, 660, 620, new Color(7, 10, 18, 248));
    this.text(this.storyTitle, -284, 220, 36, new Color(255, 209, 138));
    const currentLine = this.storyLines[this.storyIndex] ?? "";
    this.paragraph(currentLine, -284, 142, 28, Color.WHITE, 16, 40);
    this.text(`${this.storyIndex + 1}/${this.storyLines.length}`, 220, -248, 22, new Color(148, 163, 184));
    this.text("点击或按空格继续", -104, -248, 22, new Color(109, 240, 255));
  }

  private backButton(g: Graphics): void {
    this.panel(g, -322, -606, 220, 58, new Color(20, 33, 58, 248));
    this.text("返回大厅", -278, -570, 24, Color.WHITE);
  }

  private panel(g: Graphics, x: number, y: number, width: number, height: number, color: Color): void {
    g.fillColor = color;
    g.strokeColor = new Color(255, 255, 255, 36);
    g.lineWidth = 2;
    g.roundRect(x, y, width, height, 26);
    g.fill();
    g.stroke();
  }

  private bar(g: Graphics, x: number, y: number, width: number, height: number, ratio: number, color: Color): void {
    g.fillColor = new Color(255, 255, 255, 32);
    g.rect(x, y, width, height);
    g.fill();
    g.fillColor = color;
    g.rect(x, y, Math.max(0, Math.min(1, ratio)) * width, height);
    g.fill();
  }

  private paragraph(content: string, x: number, y: number, size: number, color: Color, maxChars: number, lineGap: number): void {
    this.wrapText(content, maxChars).forEach((line, index) => {
      this.text(line, x, y - index * lineGap, size, color);
    });
  }

  private wrapText(content: string, maxChars: number): string[] {
    const lines: string[] = [];
    let line = "";
    for (const char of content) {
      line += char;
      if (line.length >= maxChars || char === "。") {
        lines.push(line);
        line = "";
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  private text(content: string, x: number, y: number, size: number, color: Color): void {
    const node = new Node(`Text:${content.slice(0, 12)}`);
    node.setParent(this.labelLayer);
    node.setPosition(new Vec3(x, y, 0));
    const label = node.addComponent(Label);
    label.string = content;
    label.fontSize = size;
    label.lineHeight = Math.ceil(size * 1.25);
    label.color = color;
  }

  private clearLabels(): void {
    if (!this.labelLayer) return;
    this.labelLayer.removeAllChildren();
  }

  private isStageCleared(stageId: number): boolean {
    return this.progress.clearedStages.includes(stageId);
  }

  private isBossPurified(bossId: string): boolean {
    return this.progress.purifiedBosses.includes(bossId);
  }

  private hasSelectedCompanion(): boolean {
    return this.progress.selectedCompanionId === FIRST_BOSS_ID && this.isBossPurified(FIRST_BOSS_ID);
  }

  private loadProgress(): void {
    const raw = this.readStorage(SAVE_KEY);
    if (!raw) {
      this.progress = this.cloneProgress(DEFAULT_PROGRESS);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
      this.progress = this.cloneProgress({
        ...DEFAULT_PROGRESS,
        ...parsed,
        clearedStages: Array.isArray(parsed.clearedStages) ? parsed.clearedStages : [],
        purifiedBosses: Array.isArray(parsed.purifiedBosses) ? parsed.purifiedBosses : [],
        viewedStoryNodes: Array.isArray(parsed.viewedStoryNodes) ? parsed.viewedStoryNodes : [],
      });
    } catch {
      this.progress = this.cloneProgress(DEFAULT_PROGRESS);
    }
  }

  private saveProgress(): void {
    this.writeStorage(SAVE_KEY, JSON.stringify(this.progress));
  }

  private cloneProgress(progress: PlayerProgress): PlayerProgress {
    return {
      gold: progress.gold,
      tickets: progress.tickets,
      clearedStages: [...progress.clearedStages],
      purifiedBosses: [...progress.purifiedBosses],
      selectedCompanionId: progress.selectedCompanionId,
      lastStageId: progress.lastStageId,
      viewedStoryNodes: [...progress.viewedStoryNodes],
    };
  }

  private readStorage(key: string): string | null {
    const runtime = globalThis as unknown as {
      wx?: { getStorageSync?: (key: string) => string };
      localStorage?: { getItem?: (key: string) => string | null };
    };
    try {
      if (runtime.wx?.getStorageSync) {
        return runtime.wx.getStorageSync(key) || null;
      }
      return runtime.localStorage?.getItem?.(key) ?? null;
    } catch {
      return null;
    }
  }

  private writeStorage(key: string, value: string): void {
    const runtime = globalThis as unknown as {
      wx?: { setStorageSync?: (key: string, value: string) => void };
      localStorage?: { setItem?: (key: string, value: string) => void };
    };
    try {
      if (runtime.wx?.setStorageSync) {
        runtime.wx.setStorageSync(key, value);
        return;
      }
      runtime.localStorage?.setItem?.(key, value);
    } catch {
      // Storage is best-effort in the prototype; gameplay continues if blocked.
    }
  }
}
