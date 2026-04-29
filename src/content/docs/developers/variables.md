---
title: Variables API
description: Read and write player and global variables programmatically.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Addon developer</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 is in alpha. The API surface may change before the stable release. Pin a specific `compileOnly` version in your build to avoid breaking on a fresh fetch.
:::

:::note
In many examples we don't follow strict Java conventions to keep the code short. We're showing how the API works, not how to write production code.
:::

AbstractMenus has a small CRUD API for the same variables menu authors edit through `/var` and `/varp`. Javadocs: [api/variables](https://github.com/AbstractMenus/minecraft-plugin/tree/master/api/src/main/java/ru/abstractmenus/api/variables).

## `Var`

[`Var`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/variables/Var.java) is the variable record. Values are stored as strings; `Var` has typed accessors that parse on read (and may throw if the stored string isn't a valid number).

Lifetimes are UTC milliseconds — compare `expiry()` to `System.currentTimeMillis()` to check whether a value is still alive. `expiry() == 0` means "no expiry".

## `VariableManager`

[`VariableManager`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/variables/VariableManager.java) is the CRUD entry point. Get one from the API:

```java
AbstractMenusApi api = AbstractMenusApi.get();
VariableManager vars = api.variables();
```

Variable names and player names passed to the manager are case-insensitive — you don't need to lowercase them yourself.

## Create a variable

```java
Var var = api.variables().createBuilder()
        .name("welcome_message")
        .value("Hello!")
        .expiry(System.currentTimeMillis() + 10_000) // expires in 10 seconds
        .build();

api.variables().saveGlobal(var);
```

For per-player variables, use `savePlayer(playerName, var)`.

`expiry(0)` (or omitting the call) creates a permanent variable.
