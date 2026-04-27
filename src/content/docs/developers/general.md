---
title: Plugin API
description: "Javadocs available under this link: <https://abstractmenus.github.io/api/>"
---

Javadocs available under this link: <https://abstractmenus.github.io/api/>

## Add API to the project

:::note
The latest API version may not match last plugin version. Some plugin versions may use same API version.
:::

If you are not using any build system, just add AbtractMenus jar file to the project in your IDE. If you are using a build system, you can use this artifacts:

### Gradle

``` groovy
repositories {
    maven { url 'https://jitpack.io' }
}

dependencies {
    compileOnly 'com.github.AbstractMenus:api:1.14'
}
```

### Maven

``` xml
<repositories>
    <repository>
        <id>jitpack</id>
        <url>https://jitpack.io</url>
    </repository>
</repositories>

<dependencies>
    <dependency>
        <groupId>com.github.AbstractMenus</groupId>
        <artifactId>api</artifactId>
        <version>1.14</version>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

You also need to add `AbstractMenus` dependency in `depend` list of your `plugin.yml` file:

``` yaml
depend:
  - "AbstractMenus"
```

## Get plugin instance

The main interface which provides access to AbstractMenus services is [AbstractMenusPlugin](https://abstractmenus.github.io/api/ru/abstractmenus/api/AbstractMenusPlugin.html). To get plugin instance, there is two ways.

:::note
Make note, that even if you has access to plugin instance on `onLoad` stage, AbstractMenus initializes all services in `onEnable` method, you have no access to services such as `VariableManager` in `onLoad` method.
:::

### Using static provider

If you don't want to use Bukkit services manager, there is [AbstractMenusProvider](https://abstractmenus.github.io/api/ru/abstractmenus/api/AbstractMenusProvider.html) class with static method `get` which provides `AbstractMenusPlugin` instance.

### Using Bukkit services manager

AbstractMenus register own plugin instance by default service manager. To get access to `AbstractMenusPlugin` instance, you just need write something like this:

``` java
AbstractMenusPlugin plugin = getServer().getServicesManager()
                .getRegistration(AbstractMenusPlugin.class)
                .getProvider();
```
