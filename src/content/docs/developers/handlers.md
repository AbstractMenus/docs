---
title: Provider handlers
description: Plug in a custom economy, permissions, level, placeholder, or skin backend through the ProviderRegistry.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Addon developer</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 is in alpha. The API surface may change before the stable release. Pin a specific `compileOnly` version in your build to avoid breaking on a fresh fetch.
:::

:::note
In many examples we don't follow strict Java conventions to keep the code short. We're showing how the API works, not how to write production code.
:::

AbstractMenus has five provider sections: **economy**, **permissions**, **levels**, **placeholders**, **skins**. Each one is an [`api.providers().<section>()`](https://abstractmenus.github.io/api/ru/abstractmenus/api/ProviderRegistry.html) accessor that returns a [`ProviderSection<T>`](https://abstractmenus.github.io/api/ru/abstractmenus/api/ProviderSection.html). You can register multiple handlers per section, give each one an id and a priority, and the operator picks which is the default in `config.conf`. Per-action overrides in HOCON win over the config default.

The pre-2.0 static `Handlers` facade is gone. Everything happens through `ProviderSection`.

## Sections at a glance

| Section | Returns | Purpose |
|---|---|---|
| `api.providers().economy()` | `ProviderSection<EconomyHandler>` | `takeMoney` / `giveMoney` / `hasMoney` |
| `api.providers().permissions()` | `ProviderSection<PermissionsHandler>` | `permission` rule, group lookups |
| `api.providers().levels()` | `ProviderSection<LevelHandler>` | `takeLevels` / `giveLevels` / `hasLevels` |
| `api.providers().placeholders()` | `ProviderSection<PlaceholderHandler>` | placeholder substitution |
| `api.providers().skins()` | `ProviderSection<SkinHandler>` | `setSkin` / `resetSkin` |

The bundled defaults register at priority **50**:

- **economy** — `vault` (Vault), `playerpoints` if you install [PlayerPointsAddon](https://github.com/AbstractMenus/PlayerPointsAddon)
- **permissions** — `vault`, `luckperms`
- **levels** — `bukkit` (vanilla XP)
- **placeholders** — `papi` (PlaceholderAPI), `internal` (built-ins)
- **skins** — `skinsrestorer`

Addon-supplied providers typically register at **100** so they win auto-resolve when both a default and an addon are present.

## Register a handler

Implement the relevant `*Handler` interface, then register it from your `MenuExtension.onEnable(api)`:

```java
public final class MyAddon implements MenuExtension {

    @Override
    public void onEnable(AbstractMenusApi api) {
        api.providers().economy().register(
            "playerpoints",                          // id
            new PlayerPointsEconomy(playerPointsApi), // handler
            100,                                      // priority — higher wins auto-resolve
            this);                                    // owner — AbstractMenus uses this for cleanup
    }
}
```

The `id` is what HOCON menus and `config.conf` reference (`provider: "playerpoints"`). It's case-insensitive. The handler instance is reused for every call.

## Resolve at runtime

```java
EconomyHandler eco       = api.providers().economy().resolve();          // configured default, or highest priority
EconomyHandler vault     = api.providers().economy().resolve("vault");   // by id, or null
boolean hasPP            = api.providers().economy().has("playerpoints");
Set<String> ids          = api.providers().economy().ids();
Collection<EconomyHandler> all = api.providers().economy().all();
```

`resolve()` first checks `config.conf providers.<section>`. If the operator pinned an explicit id, that wins. If they left it on `"auto"`, the highest-priority registered handler wins. The lookup is atomic: a concurrent `unregister` cannot return a stale handler.

`resolve(String)` is what menu actions use when an HOCON entry has `provider: "..."`. The per-action override always beats the config default.

## Example: a custom economy backend

Override the default economy with one that stores balances in a `Map`:

```java
public final class MapEconomy implements EconomyHandler {

    private final Map<UUID, Double> balance = new ConcurrentHashMap<>();

    @Override
    public boolean hasBalance(Player player, double amount) {
        return balance.getOrDefault(player.getUniqueId(), 0.0) >= amount;
    }

    @Override
    public void takeBalance(Player player, double amount) {
        balance.merge(player.getUniqueId(), -amount,
                (current, delta) -> Math.max(0, current + delta));
    }

    @Override
    public void giveBalance(Player player, double amount) {
        balance.merge(player.getUniqueId(), amount, Double::sum);
    }
}
```

Register it from your addon:

```java
@Override
public void onEnable(AbstractMenusApi api) {
    api.providers().economy().register(
        "memory",
        new MapEconomy(),
        100,
        this);
}
```

To make it the server-wide default, the operator sets:

```hocon title="config.conf"
providers {
  economy = "memory"
}
```

Or per-menu, leaving the global default alone:

```hocon
actions {
  click: [
    { type: takeMoney, amount: 100, provider: "memory" }
  ]
}
```

## Handler interfaces

All five live under `ru.abstractmenus.api.handler.*`:

| Interface | Methods |
|---|---|
| [`EconomyHandler`](https://abstractmenus.github.io/api/ru/abstractmenus/api/handler/EconomyHandler.html) | `hasBalance`, `takeBalance`, `giveBalance` |
| [`PermissionsHandler`](https://abstractmenus.github.io/api/ru/abstractmenus/api/handler/PermissionsHandler.html) | `hasPermission`, `getGroup` |
| [`LevelHandler`](https://abstractmenus.github.io/api/ru/abstractmenus/api/handler/LevelHandler.html) | `hasLevels`, `takeLevels`, `giveLevels` |
| [`PlaceholderHandler`](https://abstractmenus.github.io/api/ru/abstractmenus/api/handler/PlaceholderHandler.html) | `replace` |
| [`SkinHandler`](https://abstractmenus.github.io/api/ru/abstractmenus/api/handler/SkinHandler.html) | `setSkin`, `resetSkin` |

Method names and signatures are stable across the 2.0 line.

## Cleanup

When your addon's `onDisable` runs, AbstractMenus drops every provider you registered automatically. You don't (and can't) call `unregisterAll` yourself — the public `ProviderRegistry` interface deliberately doesn't expose it. One addon can't wipe another's providers.

For Path 1 addons, "disable" means your `JavaPlugin.onDisable`. Note that AbstractMenus's auto-cleanup only fires for addons it's tracking through its `AddonManager`, which means Path 2 only. For Path 1, the registration sits in the owner-tracking map until AbstractMenus itself shuts down. Re-registering under the same id from a fresh `onEnable` overwrites the live entry, so this isn't a leak in practice.
