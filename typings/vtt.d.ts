type VttGame = {
  user: VttUser;
  pf2e: { rollActionMacro: (itemId: string, actionIndex: number, baseType: string) => Promise<unknown> };
};
type VttUser = {
  _id: string;
  character: Pf2eCharacter | null;
};
type Pf2eCharacter = {
  inventory: Map<string, Pf2eItem> & {
    contents: Array<Pf2eItem>;
  };
  system: {
    actions: Array<{
      slug: string;
      variants: Array<{
        label: string;
        roll: () => Promise<unknown>;
      }>;
    }>;
  };
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
  update: (data: { [key: string]: any }) => Promise<void>;
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

declare const game: VttGame;
declare const ui: VttUI;
declare class Dialog {
  constructor(options: DialogOptions);
  render(bool: boolean): void;
  static prompt(options: DialogOptions): void;
}
declare class ChatMessage {
  static getSpeaker(options: { token: typeof actor }): Speaker;
  static create(options: { user: string; speaker: Speaker; content: string }): void;
}
declare const actor: {};
