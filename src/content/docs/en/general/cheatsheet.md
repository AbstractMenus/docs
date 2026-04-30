---
title: Cheatsheet
description: Every action, rule, activator, item property, and catalog in one ctrl-F'able page.
---

<div class="audience-tags"><span class="audience-tag audience-author">Menu author</span></div>

One-page reference. Names, one-line descriptions, and a link to the full doc for each entry. Ctrl-F friendly.

## Activators — what opens a menu

| Name | What it does | Detail |
|---|---|---|
| `command` | `/menu` or any other custom command | [docs](/docs/en/general/activators/#activator-command) |
| `chat` | Player types an exact phrase in chat | [docs](/docs/en/general/activators/#activator-chat) |
| `containsChat` | Player's chat message contains a substring | [docs](/docs/en/general/activators/#activator-chat) |
| `join` | Player joins the server | [docs](/docs/en/general/activators/) |
| `regionJoin` | Player enters a WorldGuard region | [docs](/docs/en/general/activators/#worldguard-regions) |
| `regionLeave` | Player leaves a WorldGuard region | [docs](/docs/en/general/activators/#worldguard-regions) |
| `clickItem` | Right-click an item in hand | [docs](/docs/en/general/activators/#activator-clickitem) |
| `clickNPC` | Right-click a Citizens NPC | [docs](/docs/en/general/activators/#activator-clicknpc) |
| `clickEntity` | Right-click an entity | [docs](/docs/en/general/activators/#activator-clickentity) |
| `shiftClickEntity` | Shift + right-click an entity | [docs](/docs/en/general/activators/#activator-shiftclickentity) |
| `clickBlock` | Click a specific block location | [docs](/docs/en/general/activators/) |
| `clickBlockType` | Click any block of a given type | [docs](/docs/en/general/activators/) |
| `button` | Press a button block | [docs](/docs/en/general/activators/#activators-button-lever-plate) |
| `lever` | Flip a lever | [docs](/docs/en/general/activators/#activators-button-lever-plate) |
| `plate` | Step on a pressure plate | [docs](/docs/en/general/activators/#activators-button-lever-plate) |
| `table` | Click a sign with specific text | [docs](/docs/en/general/activators/) |
| `swapItems` | Press the swap-hand key (default `F`) | [docs](/docs/en/general/activators/) |

## Rules — checked before opening / before showing an item / before running an action

| Name | What it checks | Detail |
|---|---|---|
| `permission` | Player has a permission node | [docs](/docs/en/general/rules/) |
| `world` | Player is in a named world | [docs](/docs/en/general/rules/) |
| `gamemode` | Player's gamemode matches | [docs](/docs/en/general/rules/) |
| `group` | Player is in a LuckPerms group | [docs](/docs/en/general/rules/) |
| `money` | Player has at least N currency (Vault / configured provider) | [docs](/docs/en/general/rules/) |
| `level` | Player has at least N levels | [docs](/docs/en/general/rules/) |
| `xp` | Player has at least N XP points | [docs](/docs/en/general/rules/) |
| `health` | Player has at least N HP | [docs](/docs/en/general/rules/) |
| `foodLevel` | Player has at least N food | [docs](/docs/en/general/rules/) |
| `chance` | Random check at N percent | [docs](/docs/en/general/rules/) |
| `online` | At least N players online | [docs](/docs/en/general/rules/) |
| `playerIsOnline` | A specific named player is online | [docs](/docs/en/general/rules/) |
| `inventoryItems` | Player has the listed items in their inventory | [docs](/docs/en/general/rules/#inventory-items) |
| `heldItem` | Item in main hand matches | [docs](/docs/en/general/rules/#held-item) |
| `freeSlot` | Inventory has a free slot (or a specific slot is free) | [docs](/docs/en/general/rules/) |
| `freeSlotCount` | Inventory has at least N free slots | [docs](/docs/en/general/rules/) |
| `existVar` | A global variable exists | [docs](/docs/en/general/rules/#var-existing) |
| `existVarp` | A per-player variable exists | [docs](/docs/en/general/rules/#var-existing) |
| `placedItem` | A drag-and-drop slot has the expected item | [docs](/docs/en/general/rules/) |
| `region` | Player is inside a WorldGuard region | [docs](/docs/en/general/rules/) |
| `bungeeOnline` | A BungeeCord server has at least N players | [docs](/docs/en/general/rules/#bungeecord-online) |
| `bungeeIsOnline` | A BungeeCord server is online | [docs](/docs/en/general/rules/) |
| `if` | Logical comparison of placeholders / values | [docs](/docs/en/general/rules/#if-rule) |
| `js` | Run a JavaScript expression | [docs](/docs/en/general/rules/#javascript) |
| `and` | All wrapped rules pass | [docs](/docs/en/advanced/logical/) |
| `or` | At least one wrapped rule passes | [docs](/docs/en/advanced/logical/) |
| `oneof` | Stops on first true | [docs](/docs/en/advanced/logical/) |
| `playerScope` | Re-evaluate rules against a different player | [docs](/docs/en/advanced/logical/) |

## Actions — what runs on click / open / activator fire

| Name | What it does | Detail |
|---|---|---|
| `message` | Send chat / actionbar / title / json to the player | [docs](/docs/en/general/actions/#message) |
| `broadcast` | Same shape as `message`, but to every online player | [docs](/docs/en/general/actions/#message) |
| `miniMessage` | Send a MiniMessage string (legacy - `message` already supports MiniMessage) | [docs](/docs/en/general/actions/#message) |
| `playerChat` | Send a chat message on behalf of the player | [docs](/docs/en/general/actions/) |
| `print` | Print to console - debug helper | [docs](/docs/en/general/actions/) |
| `command` | Run commands as player and/or console | [docs](/docs/en/general/actions/#command) |
| `inputChat` | Capture chat input into a variable | [docs](/docs/en/advanced/input/#chat-input) |
| `teleport` | Teleport the player to a location | [docs](/docs/en/general/actions/#teleport) |
| `bungeeConnect` | Send the player to a BungeeCord server | [docs](/docs/en/general/actions/) |
| `setGamemode` | Change the player's gamemode | [docs](/docs/en/general/actions/) |
| `setHealth` | Set health | [docs](/docs/en/general/actions/) |
| `setFoodLevel` | Set food level | [docs](/docs/en/general/actions/) |
| `sound` | Play a Bukkit sound | [docs](/docs/en/general/actions/#sound) |
| `customSound` | Play a resource-pack sound | [docs](/docs/en/general/actions/#custom-sound) |
| `potionEffect` | Apply a potion effect | [docs](/docs/en/general/actions/#add-potion-effect) |
| `removePotionEffect` | Remove a potion effect | [docs](/docs/en/general/actions/#remove-potion-effect) |
| `openBook` | Open a virtual written book | [docs](/docs/en/general/actions/#open-book) |
| `addRecipe` | Add a knowledge-book recipe | [docs](/docs/en/general/actions/#add-recipe) |
| `itemAdd` | Add items to the player's inventory | [docs](/docs/en/general/actions/#add-item) |
| `itemRemove` | Remove items by slot or by match | [docs](/docs/en/general/actions/#remove-item) |
| `itemClear` | Same as `itemRemove`, ignoring stack count | [docs](/docs/en/general/actions/#remove-item) |
| `inventoryClear` | Wipe the player's inventory | [docs](/docs/en/general/actions/) |
| `openMenu` | Open another menu | [docs](/docs/en/general/actions/) |
| `openMenuCtx` | Open another menu, forwarding activator context | [docs](/docs/en/general/actions/) |
| `closeMenu` | Close the current menu | [docs](/docs/en/general/actions/) |
| `refreshMenu` | Re-render the whole menu | [docs](/docs/en/general/actions/) |
| `refreshItem` | Re-render a single item | [docs](/docs/en/general/actions/#refresh-item) |
| `setProperty` | Add or overwrite item properties on the open menu | [docs](/docs/en/general/actions/#set-item-property) |
| `remProperty` | Remove properties from an item in the open menu | [docs](/docs/en/general/actions/#remove-item-property) |
| `setButton` | Add or replace a button in the open menu | [docs](/docs/en/general/actions/#set-menu-button) |
| `removeButton` | Remove a button from the open menu | [docs](/docs/en/general/actions/#remove-menu-button) |
| `placeItem` | Drag-and-drop helper to place an item in a draggable slot | [docs](/docs/en/advanced/drag-and-drop/) |
| `removePlaced` | Remove (or partially remove) a placed item | [docs](/docs/en/advanced/drag-and-drop/) |
| `pageNext` / `pagePrev` | Switch pages in a generated menu | [docs](/docs/en/general/actions/) |
| `delay` | Run wrapped actions after N ticks | [docs](/docs/en/general/actions/#delay) |
| `bulk` | Run several action groups under one block | [docs](/docs/en/general/actions/#bulk) |
| `randActions` | Pick one block at random | [docs](/docs/en/general/actions/#random-actions) |
| `playerScope` | Run actions for a different player | [docs](/docs/en/general/actions/#player-scope-actions) |
| `takeMoney` / `giveMoney` | Currency withdraw / deposit (economy provider) | [docs](/docs/en/general/actions/#provider-selection) |
| `givePermission` / `removePermission` | Grant / revoke a permission node (permissions provider) | [docs](/docs/en/general/actions/#provider-selection) |
| `addGroup` / `removeGroup` | Add / remove a group (permissions provider) | [docs](/docs/en/general/actions/#provider-selection) |
| `lpMetaSet` / `lpMetaRemove` | LuckPerms metadata mutation (LuckPerms required) | [docs](/docs/en/general/actions/) |
| `giveXp` / `takeXp` | XP credit / debit (levels provider) | [docs](/docs/en/general/actions/#provider-selection) |
| `giveLevel` / `takeLevel` | Level credit / debit (levels provider) | [docs](/docs/en/general/actions/#provider-selection) |
| `setSkin` / `resetSkin` | Apply / reset a skin (skins provider) | [docs](/docs/en/general/actions/#set-skin) |
| `setVar` / `removeVar` / `incVar` / `decVar` / `mulVar` / `divVar` | Global variable ops | [docs](/docs/en/general/actions/#global-vars) |
| `setVarp` / `removeVarp` / `incVarp` / `decVarp` / `mulVarp` / `divVarp` | Personal variable ops | [docs](/docs/en/general/actions/#personal-vars) |

If the action is money / level / permission / placeholder / skin related, you can append `provider: "vault"` (or any other registered id) to pin which backend handles it. See [provider handlers](/docs/en/developers/handlers/).

## Item properties

| Group | Properties |
|---|---|
| Material installer | `material`, `texture`, `skullOwner`, `hdb`, `mmoitem`, `itemsAdder`, `oraxen`, `equipItem`, `serialized` |
| Display | `name`, `lore`, `nameLight`, `loreLight`, `glow`, `flags`, `color`, `model` |
| Mechanics | `count`, `damage`, `data`, `unbreakable`, `enchantments`, `enchantStore`, `attributeModifier`, `potionData`, `fireworkData`, `bookData`, `bannerData`, `shieldData`, `recipes`, `nbt` |
| Slot | `slot` (number, X-Y, range, matrix) |
| Cooldown | `clickCooldown` (milliseconds) |
| Conditional | `bindings` (override properties when rules match) |

Full reference with examples: [item format](/docs/en/general/item-format/).

`nameLight` / `loreLight` are the legacy variants of `name` / `lore` that ignore MiniMessage and only handle `&` color codes. Useful when a name happens to contain `<` characters that MiniMessage would try to parse.

## Catalogs — for generated menus

| Name | What it produces | Detail |
|---|---|---|
| `iterator` | Sequence of integers from `start` to `end` | [docs](/docs/en/advanced/generation/#iterator) |
| `players` | Online players | [docs](/docs/en/advanced/generation/#players) |
| `entities` | Entities of the viewer's (or named) world | [docs](/docs/en/advanced/generation/#entities) |
| `worlds` | Loaded worlds | [docs](/docs/en/advanced/generation/#worlds) |
| `bungee_servers` | BungeeCord servers (requires `bungeecord: true`) | [docs](/docs/en/advanced/generation/#bungeecord-servers) |
| `slice` | Split a string into elements by separator | [docs](/docs/en/advanced/generation/#slice) |

## Commands — operator and author

| Command | Purpose | Detail |
|---|---|---|
| `/am open <menu> [player]` | Open a menu | [docs](/docs/en/general/commands/) |
| `/am reload` | Reload all menu files | [docs](/docs/en/general/commands/) |
| `/am serve` | Watch & auto-reload (dev) | [docs](/docs/en/general/commands/) |
| `/am version` | Print version | [docs](/docs/en/general/commands/) |
| `/am addons list` | List loaded addons | [docs](/docs/en/general/commands/#am-addons) |
| `/am addons info <name>` | Addon metadata | [docs](/docs/en/general/commands/#am-addons) |
| `/am addons load <name>` | Load a Path 2 addon | [docs](/docs/en/general/commands/#am-addons) |
| `/am addons reload <name>` | Hot-reload a Path 2 addon | [docs](/docs/en/general/commands/#am-addons) |
| `/am addons rescan` | Pick up new jars in `addons/` | [docs](/docs/en/general/commands/#am-addons) |
| `/var` subcommands | Manage global variables | [docs](/docs/en/general/commands/#var) |
| `/varp` subcommands | Manage per-player variables | [docs](/docs/en/general/commands/#varp) |

Single permission gates everything: **`am.admin`**.
