---
title: Rules
description: "A rule is a check before performing some actions. The result of this check influences what actions will be performed."
---

A rule is a check before performing some actions. The result of this check influences what actions will be performed.

Rules has simple format. Example:

```hocon
rules {
  permission: "some.perm"
}
```

You can specify one or several rules, similar to activators and actions. Every new rule must be on the new line. For example:

```hocon
rules {
  permission: "some.perm"
  group: "default"
  money: 3000
}
```

In this example, we check a player for permission "some.perm", a group "default" and money amount in 3000. All next actions will be executed only if player matches all of these rules.

## All rules

| Name | Data type | Example | Description |
|----|----|----|----|
| permission | Strings list | `permission: "some.perm"` | Does the player has a permission |
| world | String | `world: "world"` | Does the player in specified world |
| gamemode | String | `gamemode: SURVIVAL` | Compare player's gamemode with specified |
| group | Strings list | `group: "default"` | Does the player is a member of all of specified **LuckPerms** groups |
| money | Number | `money: 2` | Does the player has enough money. **Vault** required |
| level | Number | `level: 1` | Does the player has required level |
| xp | Number | `xp: 20` | Does the player has required XP |
| health | Number | `health: 15` | Does the player has required HP |
| foodLevel | Number | `foodLevel: 5` | Does the player has required food level |
| chance | Number | `chance: 50` | A random chance to complete this rule in percentages |
| online | Number | `online: 17` | Is there required players count on the server |
| playerIsOnline | String | `playerIsOnline: "Notch"` | Chck is required player on the server |
| inventoryItems | Objects list | See example `rule-items` | Does player has a items, specified in the list |
| heldItem | Object | See example `rule-held` | Does the item in the player's main hand match the specified item |
| freeSlot | Number | `freeSlot: -1` `freeSlot: 3` | Checks player inventory for free slot. If number is greater that `-1` it will check specified slot. If number lesser than `0` it will check inventory for any free slot |
| freeSlotCount | Number | `freeSlotCount: 2` | Checks player inventory for specify free slots count. If player has a same or more free slots it will return true |
| existVar | String, Object | See example `rule-var` | Check is there exists global variable |
| existVarp | String | See example `rule-var` | Check is there exists personal variable |
| placedItem | Object | See example `rule-placed-item` | For drag-and-drop. Check is there placed some item in menu by player |
| **WorldGuard** |  |  |  |
| region | Strings list | `region: "myregion"` | Checks player is in one of the specified **WorldGuard** regions |
| **BungeeCord** |  |  |  |
| bungeeOnline | Object | See example `rule-bungee` | Does bungee server has enough players count |
| bungeeIsOnline | String | `bungeeIsOnline: "lobby"` | Checks the specified **BunegeCord** server is online |
| **Complex rules** |  |  |  |
| if | Objects list | See example `rule-if` | Checks some text and numeric parameters |
| js | String | See example `rule-js` | Execute JavaScript script and check the result |
| **Special rules** |  |  |  |
| and | Objects list | See example [here](logical-and) | Logical wrapper for rules implemented with 'AND' operator |
| or | Objects list | See example [here](logical-or) | Logical wrapper for rules implemented with 'OR' operator |
| oneof | Objects list | See example [here](logical-oneof) | Works as `and` wrapper but will be stopped if some rule in the list will be `true` |
| playerScope | Object | See example [here](rule-player-scope) | Rules wrapper to check another player found by name |

## Inventory items

Rule to check player's inventory for some items. This is an [objects list](hocon-list-obj), where each object is an item. Items has same format as anywhere in AM. Example:

```hocon
inventoryItems: [
  {
    material: CAKE
    amount: 5
  },
  {
    material: STONE
    amount: 2
  }
]
```

You can also use it as a single object. Example:

```hocon
inventoryItems {
  material: CAKE
  amount: 5
}
```

If you add `slot` parameter, this rule will check item in specified slot or slots:

```hocon
inventoryItems {
  slot: 0
  material: CAKE
  amount: 5
}
```

The rule above will be `true` for player if it has at least 5 cakes in slot 0. You can also use other slot formats, for example:

```hocon
inventoryItems {
  slot: "0-8"
  material: CAKE
  amount: 5
}
```

The rule above will be `true` for player if it has at least 5 cakes in each slot `0, 1, 2, ..., 8`

## Held item

Rule to check a held item.

```hocon
heldItem {
  material: CAKE
  amount: 5
}
```

## Var existing

Rules to check is there exists some variable.

For global variables:

```hocon
existVar: "global_var_name"
```

For personal variables:

```hocon
existVarp: "personal_var_name"
```

Rule `existVar` also has legacy format. It can be specified as object with variable name and optional name of player - variable owner.

```hocon
existVar {
  player: "Peter" // Specify only if variable is personal. Optional parameter
  name: "name" // Name of the variable. Required parameter.
}
```

- **`name`** - Variable name.

- **`player`** - **\[Optional\]** Specify if you need to check personal variable.

However, we recommend you to use brief format of `existVar` rule where this possible.

## BungeeCord online

:::note
Make sure you enabled `bungeecord` in plugin config. If not, this rule will not work.
:::

Rule to check players count on some BungeeCord server. Example:

```hocon
bungeeOnline {
  server: "lobby"
  online: 20
}
```

- **`server`** - BungeeCord server name.

- **`online`** - Required players count.

## "If" rule

Rule to compare some data (for example, placeholder from PAPI) with another data.

The `if` rule has two formats: modern and legacy. Use the modern form — the legacy form is kept only so old menus keep parsing.

### Modern "If" format

This format similar to `js` rule. But unlike `js`, modern `if` works much faster, around 8-10 times. Example:

```hocon
if: "%player_name% == Notch"
```

Here we compare placeholder with some value. Modern `if` has no math expressions, only logical. Below are all logical operators which you can use for your expressions.

| Operator | Example | Means | Priority |
|----|----|----|----|
| > | %player_level% \> 5 | More | 3 |
| < | %player_level% \< 8 | Less | 3 |
| >= | %player_level% \>= 5 | More or equals | 3 |
| <= | %player_level% \<= 8 | More or equals | 3 |
| == | `%player_level% == 9` | Equals | 2 |
| != | `%player_level% != 9` | Not equals | 2 |
| === | `%player_name% === nOtCh` | Equals ignore case | 2 |
| !== | `%player_name% !== nOtCh` | Not equals ignore case | 2 |
| && | %player_level% \> 5 && %player_name% == Notch | And | 1 |
| \|\| | %player_level% \> 5 || %player_name% == Notch | Or | 0 |

Unlike `js` rule, inside `if` you don't need to use quotes (`''`, `""`) to define strings. There are also logical brackets `()` to define logical groups and increase priority of some operations. Example:

```hocon
if: "(%player_lvl% == 5 || %player_lvl% == 10) && (%player_name% == Notch || %player_name% == Nanit)"
```

This expression will return true if player has level 5 or 10 AND if has username "Notch" or "Nanit".

If you need math operations or more complex conditions, then you can use `js` rule. But if not, we recommend use modern `if` rule to speed up you menus.

### Legacy "If" format

:::caution
We don't recommend use this format since modern `if` more brief, uderstandable and has more abilities to build complex logical expressions.
:::

Example:

```hocon
if {
  param: "%player_name%"
  equals: [
    "Notch",
    "DeadMouse"
  ]
  equalsIgnoreCase: [
    "notch",
    "deadmouse"
  ]
  contains: [
    "dead",
    "tch"
  ]
  less: 6
  more: 2
}
```

Parameter `param` is required. All other are optional.

- **`param`** - The parameter which you compare (`%player_name%` is a placeholder which replaces to player name who opened menu).

- **`equals`** - Check parameter with list of strings. **Case sensitivity**.

- **`equalsIgnoreCase`** - Check parameter with list of strings. **Case insensitivity**

- **`contains`** - Check parameter to contains one of the specified substring.

- **`less`** - Does the parameter less than the specified number. For numeric parameters only.

- **`more`** - Does the parameter greater than the specified number For numeric parameters only.

## JavaScript

:::note
AbstractMenus 2.0 ships its own bundled JavaScript engine (Nashorn standalone) since the JDK dropped Nashorn after Java 14. The `js` rule works on every supported server out of the box; you don't need a separate JS jar.
:::

The plugin allows you to use JavaScript code. Code inside must always return the result - `true` or `false`. If the code returns something else, the plugin will suppose this is a `false`. This rule can be used as a replacement for the `if` rule because of its greater versatility. But you should understand that interpreting JavaScript will take longer than the `if` rule.

The `js` rule supports placeholders. This will allow you to compare them, and manipulate them using JavaScript syntax. Example:

```hocon
rules {
  js: "'%player_name%'.length < 5"
}
```

## Player scope rules

If you need to check another player, you can use special rules wrapper called `playerScope`. Example with item display rules:

```hocon
{
  slot: 0
  material: cake
  rules {
    playerScope {
      name: "%player_name_placeholder%"
      rules {
        permission: "perm.name"
      }
    }
  }
}
```

The rules inside `rules` block will be executed for player who found by name, entered in `name` field. In our case, item will be shown if player found by placeholder has `perm.name` permission.

:::note
If player not found, this rule just will return false, without throwing error.
:::
