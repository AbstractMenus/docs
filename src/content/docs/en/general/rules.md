---
title: Rules
description: "A rule is a check before performing some actions. The result of this check influences what actions will be performed."
---

<div class="audience-tags"><span class="audience-tag audience-author">Menu author</span></div>

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

| Name | Data type | Description |
|----|----|----|
| permission | Strings list | Player has a permission node |
| world | String | Player is in the named world |
| gamemode | String | Player's gamemode matches |
| group | Strings list | Player is in a LuckPerms group |
| money | Number or Object | Player has at least N currency. Object form `{ amount, provider }` lets you pin a specific economy provider — see [Provider selection](/docs/en/general/actions/#provider-selection). |
| level | Number | Player has at least N levels |
| xp | Number | Player has at least N XP points |
| health | Number | Player has at least N HP |
| foodLevel | Number | Player has at least N food level |
| chance | Number | Random check at N percent |
| online | Number | At least N players online |
| playerIsOnline | String | A specific player is online |
| [inventoryItems](#inventory-items) | Objects list | Player has the listed items in inventory |
| [heldItem](#held-item) | Object | Item in main hand matches |
| freeSlot | Number | Inventory has a free slot (or specific slot is free) |
| freeSlotCount | Number | Inventory has at least N free slots |
| [existVar](#var-existing) | String or Object | A global variable exists |
| [existVarp](#var-existing) | String | A per-player variable exists |
| placedItem | Object | A drag-and-drop slot has the expected item |
| **WorldGuard** |  |  |
| region | Strings list | Player is inside a WorldGuard region |
| **BungeeCord** |  |  |
| [bungeeOnline](#bungeecord-online) | Object | A BungeeCord server has enough players |
| bungeeIsOnline | String | A BungeeCord server is online |
| **Complex rules** |  |  |
| [if](#if-rule) | Objects list | Compare placeholders with text or numeric values |
| [js](#javascript) | String | Run a JavaScript expression and use its result |
| **Special rules** |  |  |
| [and](/docs/en/advanced/logical/) | Objects list | Logical AND wrapper |
| [or](/docs/en/advanced/logical/) | Objects list | Logical OR wrapper |
| [oneof](/docs/en/advanced/logical/) | Objects list | Stops on the first matching rule |
| [playerScope](/docs/en/advanced/logical/) | Object | Re-evaluate rules against a different player |

## Inventory items

Rule to check player's inventory for some items. This is an [objects list](/docs/en/start/hocon/), where each object is an item. Items has same format as anywhere in AM. Example:

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
| `>` | `%player_level% > 5` | More | 3 |
| `<` | `%player_level% < 8` | Less | 3 |
| `>=` | `%player_level% >= 5` | More or equals | 3 |
| `<=` | `%player_level% <= 8` | Less or equals | 3 |
| `==` | `%player_level% == 9` | Equals | 2 |
| `!=` | `%player_level% != 9` | Not equals | 2 |
| `===` | `%player_name% === nOtCh` | Equals ignore case | 2 |
| `!==` | `%player_name% !== nOtCh` | Not equals ignore case | 2 |
| `&&` | `%player_level% > 5 && %player_name% == Notch` | And | 1 |
| \|\| | %player_level% > 5 \|\| %player_name% == Notch | Or | 0 |

Unlike `js` rule, inside `if` you don't need to use quotes (`''`, `""`) to define strings. There are also logical brackets `()` to define logical groups and increase priority of some operations. Example:

```hocon
if: "(%player_lvl% == 5 || %player_lvl% == 10) && (%player_name% == Notch || %player_name% == Nanit)"
```

This expression will return true if player has level 5 or 10 AND if has username "Notch" or "Nanit".

If you need math operations or more complex conditions, then you can use `js` rule. But if not, we recommend use modern `if` rule to speed up you menus.

### Legacy "If" format

:::caution
We don't recommend this format. Modern `if` is more concise, easier to understand, and supports more complex logical expressions.
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
