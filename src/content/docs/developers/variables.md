---
title: Variables API
description: "AbstractMenus provides some CRUD methods for own variables system. Javadocs for all variables-related classes located…"
---

:::note
In many examples we do not adhere to some Java conventions and common code style to avoid boilerplate code. We want to show how to use API, and not how to write the proper code in Java.
:::

AbstractMenus provides some CRUD methods for own variables system. Javadocs for all variables-related classes located [here](https://abstractmenus.github.io/api/ru/abstractmenus/api/variables/package-summary.html).

## Interface `Var`

The [Var](https://abstractmenus.github.io/api/ru/abstractmenus/api/variables/Var.html) interface provides access to variable data. All variables stored as string, so actual data getter is `value()` method.

It also has methods to convert raw stirng data to other Java primitive type. But make note, they may throw exception.

Variable lifetime based on Java UTC time and means milliseconds. The easiest way to check is value expired is to compare value from `expiry()` method with `System.currentTimeMillis()`.

## Interface `VariableManager`

The [VariableManager](https://abstractmenus.github.io/api/ru/abstractmenus/api/variables/VariableManager.html) interface provides CRUD methods for variables. Here you can manage global and personal variables. It also has `createBuilder()` method to create builder to build own variable.

:::note
Note, that `username` and `name` (name of variable) arguments are case insensitive, so you don't need to make them lowercase manually.
:::

## Create new variable

To create new variable, you need to call `createBuilder` method of `VariableManager` interface. How to get instance if this manager, described on the [main page of API docs](api-get-instance).

``` java
AbstractMenusPlugin plugin = AbstractMenusProvider.get();

Var var = plugin.getVariableManager().createBuilder()
        .name("var_name")
        .value("Hello")
        .expiry(System.currentTimeMillis() * 10000) // 10 seconds
        .build();

plugin.getVariableManager().saveGlobal(var);
```
