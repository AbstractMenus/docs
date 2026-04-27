---
title: Utils
description: "The API contains various utilities for replacing colors, placeholders, etc."
---

:::note
In many examples we do not adhere to some Java conventions and common code style to avoid boilerplate code. We want to show how to use API, and not how to write the proper code in Java.
:::

The API contains various utilities for replacing colors, placeholders, etc.

## Replace color codes

To replace color codes in a string or list of strings, use the `Colors` util.

``` java
String str = Colors.of("&aHello!");
```

## Replace placeholders

To replace placeholders in some string, use one of the handlers that can be obtained using the `Handlers` class. The placeholder handler works with both default placeholders and PAPI.

``` java
String str = Handlers.getPlaceholderHandler().replace(player, menu, str);
```
