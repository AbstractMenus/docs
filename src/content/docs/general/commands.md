---
title: Commands
description: Every command AbstractMenus registers, what it does, and the permissions involved.
---

All AbstractMenus commands are gated behind `am.admin`. Op players have it implicitly; for staff without op, grant it through your permissions plugin.

## /am

The plugin's main command. Subcommands:

| Subcommand | What it does |
|---|---|
| `/am open <menu>` | Open a menu for yourself (no activator context). |
| `/am open <menu> <player>` | Open a menu for another player. |
| `/am reload` | Reload all menu files from `plugins/AbstractMenus/menus/`. Re-runs HOCON parse, drops opened menus. |
| `/am serve` | Watch the menus folder and reload on change. Toggle off by running it again. Author-time tool — don't leave it on in production. |
| `/am version` | Print the running plugin version. |

### /am addons

Manage addons — both Path 1 plugin-as-addons and Path 2 AM-loaded jars.

| Subcommand | What it does |
|---|---|
| `/am addons list` | List every loaded addon. Path 1 entries are tagged `[as-plugin]`, the built-in core is `[built-in]`, Path 2 has no tag. |
| `/am addons info <name>` | Full metadata: status, version, authors, description, dependencies. For Path 1 it surfaces the Bukkit `plugin.yml` description; for Path 2 it surfaces `addon.conf`. |
| `/am addons load <name>` | Load a Path 2 addon that's in `plugins/AbstractMenus/addons/` but not yet loaded. Tab-completes available unloaded addons. |
| `/am addons reload <name>` | Disable, rebuild the classloader, and re-enable a Path 2 addon. Path 1 addons need a server `/reload` instead. |
| `/am addons rescan` | Scan `addons/` for new jars and load any that aren't loaded yet. |

Tab completion is wired up for `info`, `reload`, and `load`. `info` completes against everything (Path 1 + Path 2 + core); `reload` and `load` complete against the relevant subset.

## /var

Manage **global** variables — same data accessible through `%var_*%` placeholders and the variable actions inside menus. Each subcommand's argument list:

| Subcommand | Args | Effect |
|---|---|---|
| `get <name>` | name | Print the current value. |
| `set <name> <value>` | name, value | Replace the value. Creates the variable if absent. |
| `rem <name>` | name | Delete the variable. |
| `inc <name> <amount>` | name, amount | Add to a numeric value. |
| `dec <name> <amount>` | name, amount | Subtract from a numeric value. |
| `mul <name> <factor>` | name, factor | Multiply a numeric value. |
| `div <name> <divisor>` | name, divisor | Divide a numeric value. |

## /varp

Same shape as `/var` but for **per-player** variables. Each subcommand takes a leading `<player>` argument:

```
/varp get <player> <name>
/varp set <player> <name> <value>
/varp rem <player> <name>
/varp inc <player> <name> <amount>
/varp dec <player> <name> <amount>
/varp mul <player> <name> <factor>
/varp div <player> <name> <divisor>
```

Per-player variables persist across reconnects — they're stored in the same SQLite file as global variables.

## Permissions

Only one permission node:

- `am.admin` — every command above.

There are no per-command split permissions. If you want a moderator who can run `/am open` but not `/am reload`, gate the moderator command through a permissions plugin's command-overrides feature, not through AbstractMenus.
