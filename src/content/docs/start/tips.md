---
title: Tips
description: Workflow shortcuts while authoring menus.
---

Small things that save time. Updated as more emerge.

## Auto-reload while editing

`/am reload` rebuilds every menu from disk, but typing it after every edit gets old fast. Run `/am serve` once and the plugin watches the menus folder. Every save reloads the changed file. Toggle off by running `/am serve` again.

:::caution
Author-time only. Don't leave the file watcher running on a production server — it's an extra IO listener for no benefit once menus stop changing.
:::

## Hot-load Path 2 addons

Drop a new `addon.conf`-bearing jar into `plugins/AbstractMenus/addons/`, then run:

```
/am addons rescan
```

The plugin picks up the new jar without a server restart. Use `/am addons reload <name>` to refresh an already-loaded addon after replacing its jar.

Path 1 plugin-as-addons need a regular `/reload` or server restart — Bukkit owns their lifecycle.

## MiniMessage when you need it

If you want `<click:run_command:...>`, `<hover:show_text:...>`, gradients, or rainbow text, flip `useMiniMessage: true` in `config.conf`. It's off by default to skip the parser pass on every render — turning it on costs a single-digit-percent hit on per-frame menu updates.

## Variables CLI

For the same data your menus read with `%var_*%` and `%varp_*%`:

```
/var set kit_cooldown 1700000000000     # epoch ms
/varp set Notch coins 500
/varp inc Notch coins 25
```

`inc`, `dec`, `mul`, `div` work for numeric values. They're cheap; running them from a console-only `/say` activator is a clean way to apply rate-limited side-effects.
