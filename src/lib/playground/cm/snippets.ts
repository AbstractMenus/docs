import { snippetCompletion, type Completion } from '@codemirror/autocomplete';

export interface SnippetDef {
  label: string;
  info: string;
  template: string;
}

export const hoconSnippets: SnippetDef[] = [
  {
    label: 'menu',
    info: 'Menu skeleton',
    template: 'title = "${1:My Menu}"\nsize = ${2:3}\n\nactivators {\n  command ${3:open} {\n    command = "${3:open}"\n  }\n}\n\nitems = [\n  ${0}\n]\n',
  },
  {
    label: 'include',
    info: 'Include another HOCON file (tab)',
    template: 'include "${1:file.conf}"',
  },
  {
    label: 'item',
    info: 'Item entry',
    template: '{\n  slot = ${1:0}\n  material = ${2:STONE}\n  name = "${3:Item Name}"\n  lore = [\n    "${4:Description}"\n  ]\n  ${0}\n}',
  },
  {
    label: 'clickaction',
    info: 'Click action block on an item',
    template: 'click {\n  left = [\n    { type = sound, sound = "ENTITY_EXPERIENCE_ORB_PICKUP" }\n  ]\n  ${0}\n}',
  },
  {
    label: 'commandact',
    info: 'Run a command as an action',
    template: '{\n  type = command\n  command = "${1:say hi}"\n  as = ${2:player}\n}',
  },
  {
    label: 'opensub',
    info: 'Open another menu',
    template: '{\n  type = openMenu\n  menu = "${1:other-menu}"\n}',
  },
  {
    label: 'permrule',
    info: 'Permission rule',
    template: '{\n  type = permission\n  permission = "${1:my.perm}"\n}',
  },
  {
    label: 'moneyrule',
    info: 'Money rule (Vault)',
    template: '{\n  type = money\n  amount = ${1:100}\n}',
  },
  {
    label: 'texturehead',
    info: 'Custom textured player head',
    template: '{\n  material = PLAYER_HEAD\n  texture = "${1:base64-texture-hash}"\n}',
  },
  {
    label: 'cmdactivator',
    info: 'Command activator block',
    template: 'activators {\n  command ${1:open} {\n    command = "${1:open}"\n    aliases = [${2}]\n  }\n}',
  },
  {
    label: 'closeact',
    info: 'Close-menu action',
    template: '{ type = closeMenu }',
  },
  {
    label: 'binding',
    info: 'Rules-gated property override (binding entry)',
    template: '{\n  rules {\n    ${1:permission} = "${2:my.perm}"\n  }\n  props {\n    ${3:material} = ${4:DIAMOND}\n  }\n}',
  },
  {
    label: 'fireworkEffect',
    info: 'Firework effect descriptor',
    template: '{\n  type = ${1:BALL}\n  colors = [${2:[255, 0, 0]}]\n  flicker = ${3:false}\n  trail = ${4:false}\n}',
  },
];

export function snippetCompletions(): Completion[] {
  return hoconSnippets.map((s) =>
    snippetCompletion(s.template, {
      label: s.label,
      info: s.info,
      type: 'snippet',
    }),
  );
}
