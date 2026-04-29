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
String resolved = ph.replace(player, menu, "Hello, %player_name%!");
```

If you don't have a `Menu` instance handy (e.g. you're rendering an unrelated message), pass `null` — the built-in handlers handle a null menu cleanly. PAPI ignores it.

## Schedule entity work safely on Folia

If your addon touches a player or other entity from a scheduled task and the server runs Folia, the global region scheduler is forbidden from touching entity state. AbstractMenus provides Folia-aware helpers under `BukkitTasks` (in the plugin module, not the api):

```java
BukkitTasks.runForEntity(player, () -> player.updateInventory());
BukkitTasks.runForEntityLater(player, () -> player.kick(reason), 20L);
```

On Spigot/Paper non-Folia, both calls fall through to the regular main-thread scheduler. On Folia, they dispatch to the entity's owning region — the only thread allowed to mutate that entity's state.

If you don't depend on the plugin module (just the api), implement the same guard yourself: branch on Folia detection and call `Bukkit.getRegionScheduler()`/`getEntityScheduler()` accordingly.

## Other reach points

```java
Plugin am = api.getPlugin();           // raw Bukkit Plugin handle (the AbstractMenus instance)
String version = api.apiVersion();     // e.g. "2.0.0-alpha.2"
```

Use `getPlugin()` when a Bukkit API call needs a `Plugin` reference and you don't have your own (e.g. registering a listener under AbstractMenus's plugin owner). Prefer your own plugin handle whenever possible — listeners owned by AbstractMenus survive your own `onDisable`.
