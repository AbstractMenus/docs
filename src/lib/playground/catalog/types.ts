export type Scope = 'menu-root' | 'item' | 'click' | 'actions' | 'rules' | 'activators';

export interface KeyDef {
  name: string;
  scope: Scope;
  valueType: 'string' | 'integer' | 'boolean' | 'list' | 'object' | 'enum' | 'duration' | 'any';
  enumRef?: 'materials' | 'sounds';
  description: string;
  example?: string;
}

export interface EnumDef {
  name: string;
  description?: string;
}
