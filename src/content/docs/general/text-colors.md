---
title: Text formatting
description: "As in most plugins, AM replaces `&` char to native Minecraft `§` color prefix. All text can be colorized. There is some examples below."
---

<div class="audience-tags"><span class="audience-tag audience-author">Menu author</span></div>

## Colors codes

As in most plugins, AM replaces `&` char to native Minecraft `§` color prefix. All text can be colorized. There is some examples below.

```hocon
message: "&aSome &etext"
```

You can use this cheat sheet to get required color code.

![Default color codes](/docs/img/colors.png)

## RGB colors

Text can be colorized with RGB hex codes wrapped in `<>` brackets:

```hocon
message: "<#00FF00>Some text"
```

This text will be colorized into green color.

RGB colors can also be combined with color codes. Example:

```hocon
message: "<#00FF00>Some &etext"
```

## MiniMessage format

:::caution
Off by default. Enable in `config.conf` by setting `useMiniMessage: true`. The flag exists because MiniMessage parsing adds a per-render pass over every string; servers that don't use MiniMessage skip the cost entirely.
:::

[MiniMessage](https://docs.adventure.kyori.net/minimessage/format.html) is a tag-based text format — `<red>`, `<rainbow>...</rainbow>`, `<gradient:#FF0000:#0000FF>`, `<click:run_command:/foo>`, `<hover:show_text:'tooltip'>`, etc.

AbstractMenus supports MiniMessage in messages and in item `name` / `lore`. It also works in books. Items render only the visual MiniMessage features (colors, gradients, decorations); interactive features like `<click>` and `<hover>` work in chat messages only.

Example of using MiniMessage in `message` action:

```hocon
message: "<hover:show_text:'<red>test'>TEST"
```

Example of using MiniMessage in item's name and lore:

```hocon
{
   slot: 0
   material: cake
   name: "<rainbow>Super Cake!</rainbow>"
   lore: [
      "",
      "<yellow>Eat <blue>me!"
   ]
}
```

![MiniMessage in item](/docs/img/minimessage_item.png)

*Result*
