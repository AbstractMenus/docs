---
title: Commands
description: Every command AbstractMenus registers, what it does, and the permissions involved.
---

<div class="audience-tags"><span class="audience-tag audience-operator">Server admin</span> <span class="audience-tag audience-author">Menu author</span></div>

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

Manage addons — both regular addons (jars in `plugins/AbstractMenus/addons/`) and plugin-as-addons.

| Subcommand | What it does |
|---|---|
| `/am addons list` | List every loaded addon. Regular addons have no tag, plugin-as-addons are tagged `[as-plugin]`, the built-in core is `[built-in]`. |
| `/am addons info <name>` | Full metadata: status, version, authors, description, dependencies. For a regular addon it surfaces the `addon.conf`; for a plugin-as-addon it surfaces the Bukkit `plugin.yml` description. |
| `/am addons load <name>` | Load an addon that's in `plugins/AbstractMenus/addons/` but not yet loaded. Tab-completes available unloaded addons. |
| `/am addons reload <name>` | Disable, rebuild the classloader, and re-enable an addon. Plugin-as-addons can't be hot-reloaded — they need a server `/reload`. |
| `/am addons rescan` | Scan `addons/` for new jars and load any that aren't loaded yet. |

Tab completion is wired up for `info`, `reload`, and `load`. `info` completes against everything (including the built-in core); `reload` and `load` complete against the relevant subset.

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

`set` accepts two extra trailing arguments:

- `/var set <name> <value> <time>` - make the variable temporary; expires after `<time>` (e.g. `1h30m`, `10s`, `2d`).
- `/var set <name> <value> <replace>` - `true` overwrites an existing variable, `false` keeps the old value if one exists.
- `/var set <name> <value> <time> <replace>` - both at once.

The third argument is interpreted as `<replace>` when it is literally `true` or `false`, otherwise as `<time>`.

## /varp

Same shape as `/var` but for **per-player** variables. Each subcommand takes a leading `<player>` argument:

```text
/varp get <player> <name>
/varp set <player> <name> <value>
/varp set <player> <name> <value> <time>
/varp set <player> <name> <value> <replace>
/varp set <player> <name> <value> <time> <replace>
/varp rem <player> <name>
/varp inc <player> <name> <amount>
/varp dec <player> <name> <amount>
/varp mul <player> <name> <factor>
/varp div <player> <name> <divisor>
```

`set` accepts the same extra `<time>` and `<replace>` arguments as `/var set` - same semantics, just scoped to a specific player.

Per-player variables persist across reconnects - they're stored in the same SQLite file as global variables.

## Permissions

Only one permission node:

- `am.admin` — every command above.

There are no per-command split permissions. If you want a moderator who can run `/am open` but not `/am reload`, gate the moderator command through a permissions plugin's command-overrides feature, not through AbstractMenus.
