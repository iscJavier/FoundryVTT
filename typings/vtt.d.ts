type VttGame = {
  user: VttUser;
  combat: PF2eCombat;
  i18n: Internationalization;
  pf2e: { rollActionMacro: (itemId: string, actionIndex: number, baseType: string) => Promise<unknown> };
};
type VttUser = {
  id: string;
  character: Pf2eCharacter | null;
};
type Pf2eCharacter = {
  inventory: Map<string, Pf2eItem> & {
    contents: Array<Pf2eItem>;
  };
  feats: PF2eFeatCategories;
  id: string;
  initiative: PF2eInitiative;
  name: string;
  system: {
    actions: Array<{
      slug: string;
      variants: Array<{
        label: string;
        roll: () => Promise<unknown>;
      }>;
    }>;
  };
  getActiveTokens: () => Array<PF2eToken>;
};
type Pf2eDamage = {
  damageType: string;
  dice: number | null;
  die: string;
};
type Pf2eItemSystem = {
  baseItem: string;
  damage: Pf2eDamage;
  property1: Pf2eDamage & {
    value: string;
  };
};
type UpdateFn = (data: { [key: string]: any }) => Promise<void>;
// type UpdateData<T> = {
//   [K in keyof T as K extends string ? `data.${K}` : never]: T[K];
// };
type Pf2eItem = {
  _source: {
    system: Pf2eItemSystem;
  };
  flags: { pf2e: { iscJavierAlchemicalCrossbow?: { shots: number } } };
  type: string;
  traits: Set<string>;
  name: string;
  slug: string;
  system: Pf2eItemSystem;
  quantity: number;
  update: UpdateFn;
  id: string;
  baseType: string;
};

type VttUI = {
  notifications: {
    warn: (message: string) => void;
    error: (message: string) => void;
  };
};

type DialogOptions = {
  title: string;
  content: string;
  buttons?: {
    [buttonName: string]: {
      label: string;
      callback: (dialogHtml: { find: (v: string) => Array<{ value: number }> }) => void;
    };
  };
};

type Speaker = {};

type Internationalization = {
  localize: (...params: Array<unknown>) => string;
  format: (...params: Array<unknown>) => string;
  lang: string;
};

type PF2eToken = {
  id: string;
  actor?: { id: string };
  scene: { id: string };
  document: { hidden: boolean };
};
type PF2eCombat = {
  combatants: Array<PF2eCombatant>;
  createEmbeddedDocuments: (embededName: string, data: Array<any>, context: { render: boolean }) => Promise<Array<PF2eCombatant>>;
  rollInitiative: (combatantIds: Array<string>) => Promise<void>;
  setInitiative: (combatantId: string, totalInitiative: number) => Promise<void>;
};
type PF2eCombatant = {
  actor: Pf2eCharacter;
  id: string;
};
type PF2eFeatCategories = {
  contents: Array<PF2eFeatCategory>;
};
type PF2eFeatCategoryId = 'archetype';
type PF2eFeatCategory = {
  id: PF2eFeatCategoryId;
  feats: Array<PF2eFeatWrapper>;
};
type PF2eFeatWrapper = {
  feat: PF2eFeat;
};
type PF2eFeat = {
  slug: string;
  system: { rules: Array<unknown> };
  update: UpdateFn;
};

declare const game: VttGame;
declare const ui: VttUI;
declare class Dialog {
  constructor(options: DialogOptions);
  render(bool: boolean): void;
  static prompt(options: DialogOptions): void;
}
type ChatMessageOptions = { user: string; speaker: Speaker; content: string };
declare class ChatMessage {
  static getSpeaker(options: { token: PF2eToken; actor: Pf2eCharacter }): Speaker;
  static create(options: ChatMessageOptions): Promise<void>;
  rolls: Array<string>;
  user: string;
  speaker: Speaker;
  content: string;
}

type RollMessageData = {
  speaker: Speaker;
  flavor: string;
  flags: {
    core?: {
      canPopout?: boolean;
      initiativeRoll?: boolean;
    };
    pf2e: {
      context: {
        actor: string;
        token: string;
        dc?: number;
        title: string;
        type: string;
        outcome?: string;
        unadjustedOutcome?: string;
        traits?: Array<string>;
      };
      unsafe: string;
      modifierName?: string;
      modifiers?: Array<PF2eModifier>;
    };
  };
};
type RollMessageOptions = {
  create: boolean;
};
declare class Roll {
  readonly total: number;
  constructor(formula: string, data?: {}, options?: {});
  evaluate(options: { async: false }): this;
  toMessage(data: RollMessageData, options?: RollMessageOptions): Promise<ChatMessage>;
}

declare const CONFIG: {
  PF2E: { checkDCs: { Label: { NoTarget: string } } };
};

declare const renderTemplate: <T>(path: string, options: T) => Promise<string>;

declare const ErrorPF2e: (message: string) => Error;

type ConvertXMLNodeOptions = {
  visible?: boolean;
  visibility?: 'all' | 'gm';
  whose?: 'self' | 'target';
  classes?: Array<string>;
};

type PF2eInitiative = {
  statistic: PF2eStatistic;
};
type PF2eStatistic = {
  check: PF2eCheck;
  label: string;
  domains: Array<string>;
  slug: string;
  modifiers: Array<PF2eModifier>;
  mod: number;
};
type PF2eCheck = {
  modifiers: Array<PF2eModifier>;
  createRollOptions: () => Set<string>;
};
type PF2eModifier = {
  enabled: boolean;
  modifier: number;
  label: string;
  slug: string;
  toObject: () => PF2eModifier;
};
