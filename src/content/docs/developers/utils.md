---
title: Utilities
description: Color helpers, placeholder substitution, scheduling.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Addon developer</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 is in alpha. The API surface may change before the stable release. Pin a specific `compileOnly` version in your build to avoid breaking on a fresh fetch.
:::

Small helpers that addons reach for often.

## Replace color codes

`Colors.of(String)` turns the legacy `&`-prefixed codes (`&a`, `&l`, etc.), section-sign codes (`§a`), and HTML-style hex codes (`<#FFAA00>`) into the section-sign form Minecraft expects. If `useMiniMessage` is enabled in `config.conf`, MiniMessage tags (`<red>`, `<rainbow>`, `<click:run_command:/foo>`) are also recognised.

```java
import ru.abstractmenus.api.text.Colors;

String coloured = Colors.of("&aHello, &b%player_name%&a!");
```

`Colors.of` returns the formatted string ready for `player.sendMessage(...)`.

## Replace placeholders

The placeholder section of the provider registry handles built-in placeholders (`%player_name%`, `%activator_*%`, etc.) and PlaceholderAPI tokens uniformly:

```java
PlaceholderHandler ph = api.providers().placeholders().resolve();
String resolved = ph.replace(player, "Hello, %player_name%!");
List<String> resolvedLore = ph.replace(player, lore);
```

`replace(Player, String)` is the single-line entry point used for display names, titles and action arguments. `replace(Player, List<String>)` is the multi-line variant used for item lore. Both tolerate `null`/empty input and never throw - if the backend errors, they return the input unchanged.

## Schedule entity work safely on Folia

If your addon touches a player or other entity from a scheduled task and the server runs Folia, the global region scheduler is forbidden from touching entity state. AbstractMenus provides Folia-aware helpers under `BukkitTasks` (in the plugin module, not the api):

```java
BukkitTasks.runForEntity(player, () -> player.updateInventory());
BukkitTasks.runForEntityLater(player, () -> player.kick(reason), 20L);
BukkitTasks.runForEntityTimer(player, () -> player.giveExp(1), 20L, 20L);
```

For non-entity-scoped work `BukkitTasks` exposes the usual scheduler shapes:

```java
BukkitTasks.runTask(() -> doWork());
BukkitTasks.runTaskAsync(() -> hitDatabase());
BukkitTasks.runTaskLater(() -> notify(), 40L);
BukkitTasks.runTaskLaterAsync(() -> upload(), 40L);
BukkitTasks.runTaskTimer(() -> tick(), 0L, 20L);
BukkitTasks.runTaskTimerAsync(() -> poll(), 0L, 20L);

if (BukkitTasks.isFolia()) {
    // path that needs entity-aware scheduling
}
```

On Spigot/Paper non-Folia these fall through to the regular Bukkit scheduler. On Folia, entity-scoped variants dispatch to the entity's owning region (the only thread allowed to mutate that entity's state) and the global ones go through the global region scheduler.

If you don't depend on the plugin module (just the api), implement the same guard yourself: branch on Folia detection and call `Bukkit.getRegionScheduler()`/`getEntityScheduler()` accordingly.

## Other reach points

```java
Plugin am = api.getPlugin();           // raw Bukkit Plugin handle (the AbstractMenus instance)
String version = api.apiVersion();     // e.g. "2.0.0-alpha.2"
```

Use `getPlugin()` when a Bukkit API call needs a `Plugin` reference and you don't have your own (e.g. registering a listener under AbstractMenus's plugin owner). Prefer your own plugin handle whenever possible - listeners owned by AbstractMenus survive your own `onDisable`.

## Logging

For consistent log output that respects AbstractMenus' log prefix, use `Logger`:

```java
import ru.abstractmenus.api.Logger;

Logger.info("Addon ready");
Logger.warning("Skipped quest entry: invalid id");
Logger.severe("Catalog snapshot failed", throwable);
```

It writes through the host plugin's `java.util.logging.Logger`, so messages appear under the `[AbstractMenus]` prefix in console regardless of which addon called it. Plain `System.out.println` works too but won't be tagged.
