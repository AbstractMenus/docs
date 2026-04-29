---
title: Cheatsheet
description: Every action, rule, activator, item property, and catalog in one ctrl-F'able page.
---

<div class="audience-tags"><span class="audience-tag audience-author">Menu author</span></div>

One-page reference. Names, one-line descriptions, and a link to the full doc for each entry. Ctrl-F friendly.

## Activators — what opens a menu

| Name | What it does | Detail |
|---|---|---|
| `command` | `/menu` or any other custom command | [docs](/docs/general/activators/#activator-command) |
| `chat` | Player types an exact phrase in chat | [docs](/docs/general/activators/#activator-chat) |
| `containsChat` | Player's chat message contains a substring | [docs](/docs/general/activators/#activator-chat) |
| `join` | Player joins the server | [docs](/docs/general/activators/) |
| `regionJoin` | Player enters a WorldGuard region | [docs](/docs/general/activators/#worldguard-regions) |
| `regionLeave` | Player leaves a WorldGuard region | [docs](/docs/general/activators/#worldguard-regions) |
| `clickItem` | Right-click an item in hand | [docs](/docs/general/activators/#activator-clickitem) |
| `clickNPC` | Right-click a Citizens NPC | [docs](/docs/general/activators/#activator-clicknpc) |
| `clickEntity` | Right-click an entity | [docs](/docs/general/activators/#activator-clickentity) |
| `shiftClickEntity` | Shift + right-click an entity | [docs](/docs/general/activators/#activator-shiftclickentity) |
| `clickBlock` | Click a specific block location | [docs](/docs/general/activators/) |
| `clickBlockType` | Click any block of a given type | [docs](/docs/general/activators/) |
| `button` | Press a button block | [docs](/docs/general/activators/#activators-button-lever-plate) |
| `lever` | Flip a lever | [docs](/docs/general/activators/#activators-button-lever-plate) |
| `plate` | Step on a pressure plate | [docs](/docs/general/activators/#activators-button-lever-plate) |
| `table` | Click a sign with specific text | [docs](/docs/general/activators/) |
| `swapItems` | Press the swap-hand key (default `F`) | [docs](/docs/general/activators/) |

## Rules — checked before opening / before showing an item / before running an action

| Name | What it checks | Detail |
|---|---|---|
| `permission` | Player has a permission node | [docs](/docs/general/rules/) |
| `world` | Player is in a named world | [docs](/docs/general/rules/) |
| `gamemode` | Player's gamemode matches | [docs](/docs/general/rules/) |
| `group` | Player is in a LuckPerms group | [docs](/docs/general/rules/) |
| `money` | Player has at least N currency (Vault / configured provider) | [docs](/docs/general/rules/) |
| `level` | Player has at least N levels | [docs](/docs/general/rules/) |
| `xp` | Player has at least N XP points | [docs](/docs/general/rules/) |
| `health` | Player has at least N HP | [docs](/docs/general/rules/) |
| `foodLevel` | Player has at least N food | [docs](/docs/general/rules/) |
| `chance` | Random check at N percent | [docs](/docs/general/rules/) |
| `online` | At least N players online | [docs](/docs/general/rules/) |
| `playerIsOnline` | A specific named player is online | [docs](/docs/general/rules/) |
| `inventoryItems` | Player has the listed items in their inventory | [docs](/docs/general/rules/#inventory-items) |
| `heldItem` | Item in main hand matches | [docs](/docs/general/rules/#held-item) |
| `freeSlot` | Inventory has a free slot (or a specific slot is free) | [docs](/docs/general/rules/) |
| `freeSlotCount` | Inventory has at least N free slots | [docs](/docs/general/rules/) |
| `existVar` | A global variable exists | [docs](/docs/general/rules/#var-existing) |
| `existVarp` | A per-player variable exists | [docs](/docs/general/rules/#var-existing) |
| `placedItem` | A drag-and-drop slot has the expected item | [docs](/docs/general/rules/) |
| `region` | Player is inside a WorldGuard region | [docs](/docs/general/rules/) |
| `bungeeOnline` | A BungeeCord server has at least N players | [docs](/docs/general/rules/#bungeecord-online) |
| `bungeeIsOnline` | A BungeeCord server is online | [docs](/docs/general/rules/) |
| `if` | Logical comparison of placeholders / values | [docs](/docs/general/rules/#if-rule) |
| `js` | Run a JavaScript expression | [docs](/docs/general/rules/#javascript) |
| `and` | All wrapped rules pass | [docs](/docs/advanced/logical/) |
| `or` | At least one wrapped rule passes | [docs](/docs/advanced/logical/) |
| `oneof` | Stops on first true | [docs](/docs/advanced/logical/) |
| `playerScope` | Re-evaluate rules against a different player | [docs](/docs/advanced/logical/) |

## Actions — what runs on click / open / activator fire

| Name | What it does | Detail |
|---|---|---|
| `message` | Send a chat message to the player | [docs](/docs/general/actions/) |
| `messageOthers` | Send a message to other players | [docs](/docs/general/actions/) |
| `actionbar` | Show an actionbar message | [docs](/docs/general/actions/) |
| `title` | Show a title / subtitle | [docs](/docs/general/actions/) |
| `sound` | Play a sound to the player | [docs](/docs/general/actions/) |
| `command` | Run a command (as player or console) | [docs](/docs/general/actions/) |
| `playerCommand` | Run as the player | [docs](/docs/general/actions/) |
| `consoleCommand` | Run as the console | [docs](/docs/general/actions/) |
| `playerChat` | Make the player say a phrase in chat | [docs](/docs/general/actions/) |
| `openMenu` | Open another menu | [docs](/docs/general/actions/) |
| `closeMenu` | Close the open menu | [docs](/docs/general/actions/) |
| `refreshMenu` | Re-render the whole menu | [docs](/docs/general/actions/) |
| `refreshItem` | Re-render a single slot | [docs](/docs/general/actions/) |
| `delay` | Wait N ticks before continuing the chain | [docs](/docs/general/actions/) |
| `giveItem` | Give an item | [docs](/docs/general/actions/) |
| `takeItem` | Take an item | [docs](/docs/general/actions/) |
| `clearInventory` | Clear the player's inventory | [docs](/docs/general/actions/) |
| `teleport` | Teleport the player to a location | [docs](/docs/general/actions/) |
| `setHealth` | Change health | [docs](/docs/general/actions/) |
| `setFood` | Change food level | [docs](/docs/general/actions/) |
| `setXp` | Change XP | [docs](/docs/general/actions/) |
| `setLevel` | Change level | [docs](/docs/general/actions/) |
| `takeMoney` | Withdraw N currency | [docs](/docs/general/actions/) |
| `giveMoney` | Add N currency | [docs](/docs/general/actions/) |
| `takeLevels` | Withdraw N levels | [docs](/docs/general/actions/) |
| `giveLevels` | Add N levels | [docs](/docs/general/actions/) |
| `setVar` | Set a global variable | [docs](/docs/general/actions/) |
| `setVarp` | Set a per-player variable | [docs](/docs/general/actions/) |
| `incVar` / `decVar` / `mulVar` / `divVar` | Numeric ops on a variable | [docs](/docs/general/actions/) |
| `removeVar` / `removeVarp` | Delete a variable | [docs](/docs/general/actions/) |
| `setSkin` | Apply a skin (SkinsRestorer) | [docs](/docs/general/actions/) |
| `resetSkin` | Reset to default skin | [docs](/docs/general/actions/) |
| `bungeeConnect` | Send the player to a BungeeCord server | [docs](/docs/general/actions/) |
| `book` | Open a virtual written book | [docs](/docs/general/actions/) |
| `input` | Wait for chat input from the player | [docs](/docs/advanced/input/) |
| `dropItem` | Drop an item from a slot | [docs](/docs/advanced/drag-and-drop/) |
| `placeItem` | Place an item into a slot | [docs](/docs/advanced/drag-and-drop/) |
| `takeItemFromSlot` | Take an item from a slot | [docs](/docs/advanced/drag-and-drop/) |

If the action is money / level / permission / placeholder / skin related, you can append `provider: "vault"` (or any other registered id) to pin which backend handles it. See [provider handlers](/docs/developers/handlers/).

## Item properties

| Group | Properties |
|---|---|
| Material installer | `material`, `texture`, `skullOwner`, `hdb`, `mmoitem`, `itemsAdder`, `oraxen`, `equipItem`, `serialized` |
| Display | `name`, `lore`, `glow`, `flags`, `color`, `model` |
| Mechanics | `count`, `damage`, `unbreakable`, `enchantments`, `enchantStore`, `potionData`, `fireworkData`, `bookData`, `bannerData`, `shieldData`, `recipes`, `nbt` |
| Slot | `slot` (number, X-Y, range, matrix) |
| Cooldown | `clickCooldown` (milliseconds) |
| Conditional | `bindings` (override properties when rules match) |

Full reference with examples: [item format](/docs/general/item-format/).

## Catalogs — for generated menus

| Name | What it produces | Detail |
|---|---|---|
| `permGroups` | LuckPerms groups | [docs](/docs/advanced/generation/) |
| `onlinePlayers` | Online players | [docs](/docs/advanced/generation/) |
| `bungeeServers` | Configured BungeeCord servers | [docs](/docs/advanced/generation/) |
| `worldPlayers` | Players in a given world | [docs](/docs/advanced/generation/) |
| `regionPlayers` | Players in a WorldGuard region | [docs](/docs/advanced/generation/) |
| `nearbyEntities` | Entities near the viewer | [docs](/docs/advanced/generation/) |
| `inventoryItems` | Player's inventory items | [docs](/docs/advanced/generation/) |
| `containerItems` | Items in a target inventory | [docs](/docs/advanced/generation/) |

## Commands — operator and author

| Command | Purpose | Detail |
|---|---|---|
| `/am open <menu> [player]` | Open a menu | [docs](/docs/general/commands/) |
| `/am reload` | Reload all menu files | [docs](/docs/general/commands/) |
| `/am serve` | Watch & auto-reload (dev) | [docs](/docs/general/commands/) |
| `/am version` | Print version | [docs](/docs/general/commands/) |
| `/am addons list` | List loaded addons | [docs](/docs/general/commands/#am-addons) |
| `/am addons info <name>` | Addon metadata | [docs](/docs/general/commands/#am-addons) |
| `/am addons load <name>` | Load a Path 2 addon | [docs](/docs/general/commands/#am-addons) |
| `/am addons reload <name>` | Hot-reload a Path 2 addon | [docs](/docs/general/commands/#am-addons) |
| `/am addons rescan` | Pick up new jars in `addons/` | [docs](/docs/general/commands/#am-addons) |
| `/var` subcommands | Manage global variables | [docs](/docs/general/commands/#var) |
| `/varp` subcommands | Manage per-player variables | [docs](/docs/general/commands/#varp) |

Single permission gates everything: **`am.admin`**.
