---
title: Activators
description: "Activator is an events that causes menu opening."
---

<div class="audience-tags"><span class="audience-tag audience-author">Menu author</span></div>

Activator is an events that causes menu opening.

All activators must be inside the `activators` block in menu root along with parameters such a `title` and `size`. You can specify one or several activators, or you can make menu without activators. Example:

```hocon
activators {
  command: [ // Open menu by one of the command in list
    "menu",
    "game"
  ]
  join: true // Also open menu on joining to server
}
```

In this example, the menu will be opened when you joined to the server, or if you enter `/menu` or `/game` command.

:::tip
Many activators, such a `command` saves their state to get values and use them in menu. More about this cool feature read in `../advanced/input` article.
:::

## All activators

| Name | Data type | Example | Description |
|----|----|----|----|
| command | Multiple types | See an [example](/docs/general/activators/) | Open menu when command entered |
| chat | Strings list | See an [example](/docs/general/activators/) | Open menu when entered some chat message |
| containsChat | Strings list | See an [example](/docs/general/activators/) | Open menu when chat message contains some word |
| join | Boolean | `join: true` | Open when player join the server |
| regionJoin | Strings list | See an [example](/docs/general/activators/) | Open menu when player joined some WG region |
| regionLeave | Strings list | See an [example](/docs/general/activators/) | Open menu when player leaved some WG region |
| clickItem | Objects list | See an [example](/docs/general/activators/) | Open menu when RMB click on the item in the hand |
| clickNPC | Numbers list | See an [example](/docs/general/activators/) | Open menu when RMB click on NPC (from Citizens) |
| clickEntity | Objects list | See an [example](/docs/general/activators/) | Open menu when RMB click on entity |
| shiftClickEntity | Objects list | See an [example](/docs/general/activators/) | Open menu when Shift-RMB click on entity |
| clickBlock | Objects list | See an [example](/docs/general/activators/) | Open menu when some block in specified location clicked |
| clickBlockType | Strings list | See an [example](/docs/general/activators/) | Open menu when some block of specified type clicked |
| button | Objects list | See an [example](/docs/general/activators/) | Open menu when button clicked |
| lever | Objects list | See an [example](/docs/general/activators/) | Open menu when lever shifted |
| plate | Objects list | See an [example](/docs/general/activators/) | Open menu when plate activated |
| table | Strings list | See an [example](/docs/general/activators/) | Open menu when sign with some text clicked |
| swapItems | None | See an [example](/docs/general/activators/) | Open menu when player swaps item. By default it's 'F' key |

## Activator `command`

**Extractor type**: [example](/docs/advanced/input/)

Open menu if player entered command. This activator has several formats which described below.

:::note
Commands registering occurs during server startup. If you change command's base name and reload plugin with `/am reload`, tab complete for new created command may not work. To make it work, you need to reload server. All other changes in commands, like changing arguments will work correctly.
:::

### Single command

Just single command name without arguments. Example:

```hocon
command: "menu"
```

### Command with aliases

You can add aliases to your command. For this, you need to write `command` activator as list of strings. Example:

```hocon
command: [
  "menu",
  "game"
]
```

When you enter `/menu` or `/game` command, menu will be opened.

### Command with arguments

This activator has other, more complex formats. You can build own commands with arguments. See the [reference](/docs/advanced/input/) topic to know how to do this.

## Activator `chat`

**Extractor type**: *None*

### Full word or phrase

This is a list in which a word or words are specified, when you enter one of them in the chat, menu will be opened. Example:

```hocon
chat: [ // Ope menu when entered to chat one of the messages
  "hello",
  "open the menu"
]
```

### Part of a word, phrase, symbol

This is a list in which you can specify words, phrases, etc. Menu will be opened if entered message contains at least one specified word, phrase or symbol. Example:

```hocon
containsChat: [
  "hey",
  "menu",
  "or"
]
```

In this example, if player's message contains `hey`, `menu` or `or` symbols together, then menu will be opened.

## WorldGuard regions

**Extractor type**: [example](/docs/advanced/input/)

These activators require the [WorldGuard](https://dev.bukkit.org/projects/worldguard) plugin and `useWorldGuard: true` in `config.conf`.

### Activator `regionJoin`

Here listed regions which will open the menu when entering into them. Example:

```hocon
regionJoin: [  // Open a menu when enter region
  "spawn",
  "otherRegion"
]
```

In this example, the menu will be opened if you enter to `spawn` or `otherRegion` region.

### Activator `regionLeave`

Here listed regions which will open the menu when leaving a region. Example:

```hocon
regionLeave: [  // Open menu when leaving from region
  "pvp",
  "someRegion"
]
```

In this example, the menu will be opened if you leave from `spawn` or `otherRegion` region.

## Activator `clickItem`

**Extractor type**: [example](/docs/advanced/input/)

You can add activator to open menu when some item clicked by right click in player's hand.

```hocon
clickItem {
  material: STONE
  name: "Open menu"
}
```

:::tip
Make sure that you specified all item properties. If some property missing, plugin won't handle click on required item.
:::

## Activator `clickNPC`

**Extractor type**: [example](/docs/advanced/input/)

Here listed NPC id which will open the menu when click NPC. Example:

```hocon
clickNPC: [
  1,
  23
]
```

In this example, the menu will be opened if you clicked on the NPC with id `1` or `23`.

:::tip
To find NPC id just type `/npc sel` while you looking at NPC. After this enter `/npc` command.
:::

## Entity clicks

Open menu by clicking on entity. There are two types of this activator: for simple clicks and clicks with `Shift` key pressed.

:::tip
All entity types can be found [here](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/entity/EntityType.html).
:::

### Activator `clickEntity`

**Extractor type**: [example](/docs/advanced/input/)

The `clickEntity` activator is a [list of objects](/docs/start/hocon/). Each object is a simple entity data. Example:

```hocon
clickEntity {
  type: ZOMBIE
  name: "&eZombie"
}
```

If you want to add multiple entities, you can use this activator as list. Example:

```hocon
clickEntity: [
  {
    type: ZOMBIE
    name: "&eZombie"
  },
  {
    type: PLAYER
  }
]
```

Each object have parameters:

- **`type`** - Bukkit's type of the entity.

- **`name`** - \[Optional\]. Display name of the entity.

In this example we specified `PLAYER` entity and `ZOMBIE` entity with `&eZombie` name. If player clicked on any player or zombie named `&eZombie`, menu will be opened.

### Activator `shiftClickEntity`

**Extractor type**: [example](/docs/advanced/input/)

This activator format similar to [example](/docs/general/activators/). The only difference is that this activator will open menu only if player sneaking (usually by `Shift` key) while click on entity. Example:

```hocon
shiftClickEntity {
  type: PLAYER
}
```

If you want to add multiple entities, you can use this activator as list. Example:

```hocon
shiftClickEntity: [
  {
    type: ZOMBIE
    name: "&eZombie"
  },
  {
    type: PLAYER
  }
]
```

## Block click

Block click activators handles clocking on block (right and left click). THere are two types of this activator, to check click by block location, or block type (material).

### Activator `clickBlock`

**Extractor type**: [example](/docs/advanced/input/)

In this code block you can specify location of some world's block. If player click on this block, menu will be opened.

```hocon
clickBlock {
  world: "world"
  x: 0.0
  y: 0.0
  z: 0.0
  yaw: 0.0
  pitch: 0.0
}
```

And short version:

```hocon
clickBlock: "world, 0.0, 0.0, 0.0, 0.0, 0.0"
```

This version has format:

```hocon
clickBlock: "<world>, <x>, <y>, <z>, <yaw>, <pitch>"
```

There is ability to specify several locations, since `clickBlock` is a list.

```hocon
clickBlock: [
  "world, 0, 0, 0",
  "world, 1, 1, 1",
]
```

### Activator `clickBlockType`

**Extractor type**: [example](/docs/advanced/input/)

In this code block you can specify type of some world's block. If player click on block of specified type, menu will be opened. Example:

```hocon
clickBlockType: STONE
```

If you want to add multiple block types, you can use this activator as list:

```hocon
clickBlockType: [
  STONE,
  CAKE
]
```

## Activators `button`, `lever`, `plate`

**Extractor type**: [example](/docs/advanced/input/)

A `button`, `lever` and `plate` activators has same format. Below is example for buttons:

```hocon
button {
  world: "world"
  x: 0.0
  y: 0.0
  z: 0.0
}
```

The location, as in other places, can be specified in one line:

`button: "<x>, <y>, <z>"` - The world will default (`world`). Yaw and Pitch are zero.

`button: "world, <x>, <y>, <z>"` - Yaw and Pitch are zero.

`button: "world, <x>, <y>, <z>, <yaw>, <pitch>"` - Includes all location parameters.

There is ability to specify several locations, since `button`, `lever` and `plate` is a lists.

```hocon
plate: [
  "world, 0, 0, 0",
  "world, 3, 1, 8",
]
```

## Activator `table` (sign)

**Extractor type**: *None*

The `table` activator is a [strings list](hocon-list-str)

```hocon
table: [
  "[OPEN]"
]
```

In this example, the label in the first line should be the text `[OPEN]`.

```hocon
table: [
  "[OPEN]"
  ""
  "menu"
]
```

In this example, the label in the first line should be the text `[OPEN]`, and on the third a `menu`.

## Activator `swapItems`

**Extractor type**: *None*

This activator opens menu if player press key to swap items. By default this key is `F`. Since this activator has no any arguments, we will use just `true` value. Example:

```hocon
activators {
  swapItems: true
}
```

:::note
This activator works only for MC 1.9+
:::
