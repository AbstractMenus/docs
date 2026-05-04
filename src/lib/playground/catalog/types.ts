export type Scope =
  | 'menu-root'
  | 'item'
  | 'click'
  | 'actions'
  | 'rules'
  | 'activators'
  | 'slot'
  | 'enchantments'
  | 'firework'
  | 'firework-effect'
  | 'potion-effect'
  | 'binding'
  | 'item-list'
  | 'binding-list'
  | 'firework-effect-list'
  | 'unknown';

export interface KeyDef {
  name: string;
  scope: Scope;
  valueType: 'string' | 'integer' | 'boolean' | 'list' | 'object' | 'enum' | 'duration' | 'any';
  enumRef?: 'materials' | 'sounds';
  /** When this key opens a `{...}` or `[{...}]`, suggestions inside switch to this scope. */
  childrenScope?: Scope;
  description: string;
  example?: string;
}

export interface EnumDef {
  name: string;
  description?: string;
}
