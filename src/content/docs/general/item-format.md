---
title: Item format
description: "An item can be specified not only as a button in a menu. This [object](hocon-obj) can be used in rules, actions and activators. However, item always has one…"
---

An item can be specified not only as a button in a menu. This [object](hocon-obj) can be used in rules, actions and activators. However, item always has one format.

## All item properties

| Name | Data type | Example | Description |
|----|----|----|----|
| slot | Multiple | See example `prop-slot` | Set slot for item. Not a regular item's property. Can be used only for menu items or in some actions and rules |
| clickCooldown | Number | `clickCooldown: 20` | Set click cooldown in ticks (1 second = 20 ticks). Will be reset after menu closed or refreshed with `refreshMenu` action |
| **Material installers** |  |  |  |
| material | String | `material: "DIAMOND_SWORD"` | Set the item material by name. On MC `1.12` and lower, numerical ids are supported |
| texture | String | See example `prop-texture` | Using custom head texture by texture id, url, or base64 encoded. You can find many heads on the <https://minecraft-heads.com> |
| skullOwner | String | See example `prop-skull-owner` | Set player's skin on head |
| hdb | String | `hdb: "2853"` | Set the head by the identifier from the [HeadDatabase](https://www.spigotmc.org/resources/14280/) |
| mmoitem | String | `mmoitem: "WEAPON:MY_SWORD"` | Take an item by type and id from the [MMOItems](https://www.spigotmc.org/resources/39267/) |
| itemsAdder | String | `itemsAdder: "<namespaced id>"` | Take a custom stack defined in [ItemsAdder](https://www.spigotmc.org/resources/73355/) registry by their namespaced id |
| oraxen | String | `oraxen: "my_sword"` | Take a custom stack defined in [Oraxen](https://www.spigotmc.org/resources/72448/) plugin |
| equipItem | String or Object | See example `prop-equip-item` | Take item from player's inventory. See all slot types |
| serialized | String | See example `prop-serialized` | Deserialize item from base64 string |
| **Other properties** |  |  |  |
| name | String | `name: "Peter Piper"` | Set display name |
| data | Number | `data: 2` | Material data (deprecated since MC `1.13`, full material names are used instead) |
| count | Number | `count: 64` | Amount of item stack |
| damage | Number | `damage: 100` | Set damage (bar under item) for damageable items. The higher the number, the lower the durability of the item |
| lore | Strings list | See example `prop-lore` | Set item lore (text under name) |
| glow | Boolean | `glow: true` | Set glowing effect (via invisible enchantment) |
| enchantments | Object | See example `prop-ench` | Add enchantment to item |
| color | String | See example | Colorize armor or potion |
| flags | Strings list | See example `prop-flags` | Add item flags |
| unbreakable | Boolean | `unbreakable: true` | Make item unbreakable (works on `1.9+`) |
| potionData | Objects list | See example `prop-potion` | Add various potion effects for item, if this item is potion |
| fireworkData | Object | See example `prop-firework` | If material is `FIREWORK_ROCKET`, or `FIREWORK`, it sets various settings of the fireworks |
| bookData | Object | See example `prop-book` | Add book's content and metadata (author, title) for writable book |
| bannerData | Object | See example `prop-banner` | Colorize banner item |
| shieldData | Object | Similar to `prop-banner` | Colorie shield item, as banner |
| model | Number | `model: 1234567` | Custom model data |
| enchantStore | Object | Same as `prop-ench` | Allows you to save the enchantment in an item that can later be used to enchant items on the anvil. Need for creating an enchantment book (`1.12+`). Works with `ENCHANTED_BOOK` material |
| recipes | Objects list | Same as recipe format | Create a book with custom recipes (knowledge book). Works with `KNOWLEDGE_BOOK` material |
| nbt | Object | See example `prop-nbt` | Add NBT tags to the item |
| **Special properties** |  |  |  |
| bindings | Objects list | See example `struct-bindings` | Binds some properties to rules. If player matches specified rules, then these properties will be applied to item |

:::note
Material installer is a property that set the item's material and optionally other parameters. You should use only one material installer property for an item.
:::

## Slot

The item's slot is the cell in the inventory (of the menu or player's) where the item will be placed. The slot can be specified in several ways:

### Way 1. X, Y coordinates

```hocon
slot: "4,3" // x,y
```

In this example, `x` and `y` means the horizontal and vertical position of the item, respectively. The countdown starts from 1. The image below can be useful to understanding this.

![How XY slots works](/docs/img/items_slots_xy.png)

### Way 2. Index

```hocon
slot: 0
```

You can specify slot just by a real index. To find out the number of the desired slot, you can use this cheat sheet:

![Slots indexes](/docs/img/items_slots_id.png)

### Way 3. Range

```hocon
slot: "0-6"
```

To place one item inside several slots, you can use ranged slots format. An item with slot above will be placed in cells with index 0, 1, ..., 6. This format can be useful to fill menu with some background item without manual putting them in every slot.

### Way 4. Matrix

```hocon
items: [
  {
    slot: [
      "xxxxxxxxx",
      "x-------x",
      "x-------x",
      "x-------x",
      "x-------x",
      "xxxxxxxxx"
    ]
    material: BLACK_STAINED_GLASS_PANE
  }
]
```

If you need more complex positioning, you can specify slot as cells matrix. For example, you need set a border for your menu. You can make something like above. Then this will look like this:

![Result of using cells matrix](/docs/img/items_slots_matrix_1.png)

Every char of this matrix is a some slot.

Char `-` is always empty slot. Char `x` represents slots which will be filled with current item. You can specify any other char except `-`.

The size of matrix may be equal or less than size of menu. This mean, you can specify slot like that with the same size of menu:

```hocon
slot: [
  "xxx",
  "x-x",
  "xxx"
]
```

And menu will looks like this:

![Result of using lesser cells matrix](/docs/img/items_slots_matrix_2.png)

:::note
The slots counting in cells matrix always starts from top-left.
:::

:::caution
Items placed by ranged slots and cells matrix doesn't cloning. This mean that if you change property of some item, changes will apply to other items placed by this slot. So you shouldn't use this slot format for unique items.
:::
## Skull Owner

This property can be used to get player's head. It takes player name as argument. For example:

```hocon
skullOwner: "Notch"
```

If you need to get head of player who opened menu, use placeholder to get player name first:

```hocon
skullOwner: "%player_name%"
```

:::caution
AbstratMenus loads player's skin on join to server. If you use name of player who is not joined to server, plugin will try to load skin data before menu will be opened. If you use static names in skullOwner, more suitable way is to use `texture` property.
:::

:::note
If some skin data cannot be loaded (for example, if player don't have skin), head will be empty (Steve or Alex).
:::

## Texture

You can specify texture using one of the following formats.

### Texture URL

Direct link to the texture image. Example:

```hocon
texture: "https://textures.minecraft.net/texture/a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787"
```

### Texture Hash

Texture hash is a sha-1 hash of skin image. This hash you can find in the end of each texture url, avoiding static `https://textures.minecraft.net/texture/` prefix. Example:

```hocon
texture: "a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787"
```

Using this way, the plugin will add the static prefix and a final url will be `https://textures.minecraft.net/texture/a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787`

### Base64 encoded

Also often called "Texture value". This is a url to texture, included in JSON and encoded using Base64 encoder. You can use such value with `base64:` prefix. Example:

```hocon
texture: "base64:eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYTQ1ZDY4YWVhODdjYzNmZDIwYjk2YjIxZTE4MjU1ZGIyOThiMmVhYzk4NjUyNjQ3MzExNmJkM2I1NzUwYjc4NyJ9fX0="
```

## Equiped Item

Item property to get item from player's inventory. By default it takes item from inventory of player who opened menu. Example:

```hocon
equipItem: HEAD
```

:::tip
All slot types you can find [here](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/inventory/EquipmentSlot.html)
:::

But you also can take item from another player's inventory. For this you need to transform this property to object and set player name. Placeholders are supported. Example:

```hocon
equipItem {
  player: "%player_name_placeholder%"
  slot: HEAD
}
```

## Deserialize from base64 string

The `serialized` item property allow to deserialize item from base64 string. Such string usually can be retrieved using `extractor-item` placeholder, for example, when you use drag-and-drop feature. Example:

```hocon
{
  slot: 0
  serialized: "%moved_item_serialized%" // Placehodler returns base64 string
  name: "New item name"
  lore: "New item lore"
}
```

If add other item properties, like `name` they will replace present properties from deserialized item.

:::note
If you save such string into variable and then use it after server update or downgrade, item may be not compatible with different server version.
:::

## Lore

The lore is a [list of strings](hocon-list-str). Each new line in the list is a line in the item's lore. For example:

```hocon
lore: [
  "Line 1",
  "Line 2",
  "Line 3"
]
```

## Enchantments

Enchantments has format `<enchantment>: <level>` where:

\<enchantment\>  
Bukkit's enchantment name. You can find it [here](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/enchantments/Enchantment.html)

\<level\>  
Level of the enchantment. Minimal level is `1`.

Example:

```hocon
enchantments {
  DAMAGE_ALL: 1
  DURABILITY: 2
}
```

## Color

Color used to paint items that support it, such as leather armor or potion. Color can be specified in one of 3 ways. In the examples, we will show a way to specify white color.

### Way 1. RGB

RGB values (0-255) separated by comma.

```hocon
color: "255,255,255" // r,g,b
```

### Way 1. Spigot color name

Use a native Spigot color names.

```hocon
color: WHITE
```

:::note[See also]
You can find list of colors [here](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/Color.html)
:::
### Way 1. HEX

Hexadecimal format like in CSS.

```hocon
color: "#FFFFFF"
```

:::note
Colors can be used only for painting leather armor, potions and other materials that supports it.
:::

## Flag

Flags are used to add new properties to item. The list of flags is a [strings list](hocon-list-str) like `lore`. For example:

```hocon
flags: [
  "HIDE_UNBREAKABLE",
  "HIDE_ENCHANTS",
]
```

Or if there is only flag:

```hocon
flags: "HIDE_ATTRIBUTES"
```

Spigot currently has the following flags:

- **`HIDE_ATTRIBUTES`** - Hide item attributes such as damage.

- **`HIDE_DESTROYS`** - Hide the information about item durability.

- **`HIDE_ENCHANTS`** - Hide item enchantments.

- **`HIDE_PLACED_ON`** - Hide information that an item can be built/placed on something like this.

- **`HIDE_POTION_EFFECTS`** - Hide potion effects :D.

- **`HIDE_UNBREAKABLE`** - Hide the `unbreakable` label.

:::note
A flags for each Spigot versions might be different or missing. Check flags for your version only on [this](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/inventory/ItemFlag.html) or similar pages. Do not trust the list above for 100%.
:::

## Potion effect

This property is a [list of objects](hocon-list-obj) containing effects of the potion. Each item in the list is a potion effect. Example:

```hocon
potionData: [
  {
    effectType: FAST_DIGGING
    duration: 100
    amplifier: 1
  },
  {
    effectType: SPEED
    duration: 100
    amplifier: 2
  }
]
```

Each potion effect has 3 required parameters:

- **`effectType`** - Potion effect type. All types can be found [here](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/potion/PotionEffectType.html).

- **`duration`** - Potion effect duration in ticks (1 second = 20 ticks).

- **`amplifier`** - Power (level) of the effect.

:::note
The `potionData` property can be used only if item's material supports this.
:::

## Firework

To create a colored firework, use `fireworkData` property. Example:

```hocon
fireworkData {
  power: 2
  effects: [
    {
      type: BALL
      trail: false
      colors: [
        "#FFFFFF",
        "#FF0000"
      ]
      fadeColors: [
        "#000000",
        "#00FF00"
      ]
    }
  ]
}
```

The `power` parameter set the lifetime of firework. This is optional parameter. By default its `1`.

The `effects` parameter is a [list of objects](hocon-list-obj). Each object is a firework effect and has several parameters:

- **`type`** - Type of the shape when firework explodes. You can find all firework types [here](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/FireworkEffect.Type.html).

- **`trail`** - Is firework has trail while launched.

- **`colors`** - List of colors when firework's explode start.

- **`fadeColors`** - List of colors when firework's explode fade.

You can add several objects in `fireworkData` property. Then it will explode with all specified effects.

:::note
This property will only work if the material of the item is `FIREWORK_ROCKET` (or `FIREWORK` on Spigot `1.12` and lower).
:::

## Book

This property can be used to create a written book with pages. Example:

```hocon
bookData {
  author: "Peter Piper"
  title: "&e&lTitle"
  pages: [
    "First page content",
    "Second page content"
  ]
}
```

This property has several parameters:

- **`author`** - The book's author which will be displayed.

- **`title`** - The displayed book's title.

- **`pages`** - The [list of strings](hocon-list-str). Each new line is a new page content.

:::note
The `bookData` property will only work for `WRITTEN_BOOK` material.
:::

## Banner

To create a decorated banner, use the `bannerData` property. There are two ways to use it:

### Way 1. NBT

You can generate a banner in any banner designer, for example in [this](https://www.planetminecraft.com/banner/), and paste the result NBT as a string parameter. Example:

```hocon
bannerData: "{BlockEntityTag: {Base: 12, Patterns: [{Pattern: hh, Color: 6}, {Pattern: vh, Color: 6}, {Pattern: lud, Color: 7}, {Pattern: tts, Color : 6}, {Pattern: vh, Color: 14}, {Pattern: cre, Color: 2}]}}"
```

### Way 2. HOCON

A more complicated, but affordable way is to specify patterns as [list of objects](hocon-list-obj). Example:

```hocon
bannerData: [
  {
    type: BASE
    color: WHITE
  },
  {
    type: MOJANG
    color: RED
  }
]
```

Each element of this list is a banner's pattern. Each pattern has this parameters:

- **`type`** - Type of the pattern. You can find all pattern types [here](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/block/banner/PatternType.html).

- **`color`** - Color of the pattern. Spigot supports only named colors for banners.

## NBT tags

:::caution
To use this property, you need to install [NBT_API](https://spigotmc.org/resources/7939) plugin first.
:::
Using NBT, you can add properties for items that has not yet been added to the plugin. NBT tags can be specified here using HOCON or a regular string. For example, you can add a name to an item via NBT tag. Example:

```hocon
{
  slot: 0
  material: IRON_PICKAXE
  nbt {
    display {
      Name: "&aMy pickaxe"
    }
  }
}
```

:::caution
Placeholders won't work inside NBT tags. This is for optimization purposes, to avoid parsing all string types inside the tag while the plugin is running.
:::

Inside the `nbt` property, you can write any HOCON constructs, and the plugin converts them to NBT tags on startup. Please note that many NBT tags differ on different versions of Minecraft. So, if some tag does not work, most likely you specified it wrong. One more example. Let's add two enchantments to the item:

```hocon
{
  slot: 0
  material: IRON_PICKAXE
  nbt {
    display {
      Name: "My pickaxe"
    }
    ench: [
      {
        id: 34
        lvl: 2
      },
      {
        id: 35
        lvl: 3
      }
    ]
  }
}
```

The `ench` parameter is a [list of objects](hocon-list-obj). The types and names of tags must exactly match those that must be in the final NBT.

Of course, you can add your own custom tags:

```hocon
nbt {
  mytag1: "mytag"
  mytag2: 15
  mytag3 {
    mytag1: "hello"
  }
}
```

Those tags will be added to the item. To check them you can use special plugins or mods.
