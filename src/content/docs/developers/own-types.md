---
title: Custom types
description: Define and register your own actions, rules, item properties, activators, and catalogs.
---

:::note
In many examples we don't follow strict Java conventions to keep the code short. We're showing how the API works, not how to write production code.
:::

AbstractMenus has five type registries. Each one exposes the same `register(key, class, serializer, owner)` shape:

```java
api.actions().register("...", MyAction.class, new MyAction.Serializer(), this);
api.rules().register("...", MyRule.class, new MyRule.Serializer(), this);
api.itemProperties().register("...", MyProperty.class, new MyProperty.Serializer(), this);
api.activators().register("...", MyActivator.class, new MyActivator.Serializer(), this);
api.catalogs().register("...", MyCatalog.class, new MyCatalog.Serializer(), this);
```

Keys are case-insensitive. The `owner` is your [`MenuExtension`](/docs/developers/addons/) instance — AbstractMenus uses it to drop your registrations when your addon disables.

Pick a vendor prefix for your keys (`myaddon_action`, `playerpoints_take`) so a future built-in named the same thing doesn't collide.

All registration calls happen in `MenuExtension.onEnable(api)`. Don't register from `onLoad` — other addons that yours depends on may not have enabled yet.

## Action

An action is something the plugin does: send a message, give an item, run a command, open another menu. Each action class implements [`Action`](https://abstractmenus.github.io/api/ru/abstractmenus/api/Action.html):

```java
public class MessageAction implements Action {

    private final String text;

    private MessageAction(String text) {
        this.text = text;
    }

    @Override
    public void activate(Player player, Menu menu, Item clickedItem) {
        player.sendMessage(text);
    }

    public static class Serializer implements NodeSerializer<MessageAction> {
        @Override
        public MessageAction deserialize(Class<MessageAction> type, ConfigNode node) {
            return new MessageAction(node.getString());
        }
    }
}
```

`clickedItem` may be `null` — depends on what triggered the action chain (a click vs. e.g. a deny-action chain that fired before any item was selected).

Register it:

```java
api.actions().register("myMessage", MessageAction.class, new MessageAction.Serializer(), this);
```

In a menu file:

```hocon
items: [
  {
    slot: 1
    material: STONE
    name: "My item"
    click {
      myMessage: "Hello! This is my action!"
    }
  }
]
```

## Rule

A rule is a boolean check evaluated against a player. It implements [`Rule`](https://abstractmenus.github.io/api/ru/abstractmenus/api/Rule.html):

```java
public class IsBobRule implements Rule {

    @Override
    public boolean check(Player player, Menu menu, Item clickedItem) {
        return "Bob".equals(player.getName());
    }

    public static class Serializer implements NodeSerializer<IsBobRule> {
        @Override
        public IsBobRule deserialize(Class<IsBobRule> type, ConfigNode node) {
            return new IsBobRule();
        }
    }
}
```

Register and use:

```java
api.rules().register("isBob", IsBobRule.class, new IsBobRule.Serializer(), this);
```

```hocon
rules {
  isBob: true
}
```

A rule with no parameters can take `true` (HOCON-shorthand for "this rule is active") in the menu config. Rules with parameters take whatever HOCON shape your serializer reads.

## Value extractor

A value extractor pulls named values out of a context object. Activators and catalogs use it to expose context data through placeholders.

It implements [`ValueExtractor`](https://abstractmenus.github.io/api/ru/abstractmenus/api/ValueExtractor.html):

```java
public class UserExtractor implements ValueExtractor {

    @Override
    public String extract(Object obj, String placeholder) {
        if (!(obj instanceof User)) return null;
        User user = (User) obj;
        return switch (placeholder) {
            case "user_name"    -> user.name;
            case "user_age"     -> String.valueOf(user.age);
            case "user_friends" -> String.valueOf(user.friends);
            default             -> null;
        };
    }
}
```

Extractors are not registered with AbstractMenus directly. The activator or catalog that uses one returns the extractor instance from a `getValueExtractor()` / `extractor()` method.

The shape is similar to PlaceholderAPI but accepts any context type, not only `Player`.

## Activator

An activator is an event listener that opens a menu. It extends the abstract [`Activator`](https://abstractmenus.github.io/api/ru/abstractmenus/api/Activator.html), which extends Bukkit's `Listener`. Inside the class, listen for any Bukkit event you need:

```java
public class SneakActivator extends Activator {

    @EventHandler
    public void onSneak(PlayerToggleSneakEvent event) {
        if (event.isSneaking()) {
            openMenu(null, event.getPlayer());
        }
    }

    public static class Serializer implements NodeSerializer<SneakActivator> {
        @Override
        public SneakActivator deserialize(Class<SneakActivator> type, ConfigNode node) {
            return new SneakActivator();
        }
    }
}
```

`openMenu(ctx, player)` opens the menu the activator is bound to. `ctx` is an opening context — null if you have nothing to attach.

:::caution
Don't register the listener with Bukkit yourself. AbstractMenus does that automatically when the activator is bound to a menu.
:::

Register the activator:

```java
api.activators().register("onSneak", SneakActivator.class, new SneakActivator.Serializer(), this);
```

### Activator with context

Pass any object as `ctx` and expose its values through a `ValueExtractor`. Below, the respawn location is the context, and `LocationExtractor` makes its coordinates available as `%activator_loc_x%` etc.:

```java
public class RespawnActivator extends Activator {

    @EventHandler
    public void onRespawn(PlayerRespawnEvent event) {
        openMenu(event.getRespawnLocation(), event.getPlayer());
    }

    @Override
    public ValueExtractor getValueExtractor() {
        return new LocationExtractor();
    }

    public static class Serializer implements NodeSerializer<RespawnActivator> {
        @Override
        public RespawnActivator deserialize(Class<RespawnActivator> type, ConfigNode node) {
            return new RespawnActivator();
        }
    }
}
```

```java
public class LocationExtractor implements ValueExtractor {

    @Override
    public String extract(Object obj, String placeholder) {
        if (!(obj instanceof Location)) return null;
        Location loc = (Location) obj;
        return switch (placeholder) {
            case "loc_x" -> String.valueOf(loc.getX());
            case "loc_y" -> String.valueOf(loc.getY());
            case "loc_z" -> String.valueOf(loc.getZ());
            default      -> null;
        };
    }
}
```

```hocon
title: "Test"
size: 1
activators {
  onRespawn: true
}
items: [
  {
    slot: 4
    material: CAKE
    name: "Test item"
    lore: [
      "Loc x: %activator_loc_x%",
      "Loc y: %activator_loc_y%",
      "Loc z: %activator_loc_z%"
    ]
  }
]
```

## Item property

An item property modifies an item's appearance — display name, lore, material, custom model data, etc.

Implement [`ItemProperty`](https://abstractmenus.github.io/api/ru/abstractmenus/api/inventory/ItemProperty.html):

- **`canReplaceMaterial`** — returns `true` if the property changes the item's material. Material-replacing properties run first so subsequent properties operate on a valid `ItemMeta`.
- **`isApplyMeta`** — return `true` if AbstractMenus should call `setItemMeta` on the stack after `apply` returns. Return `false` if `apply` already handles meta itself.
- **`apply`** — modifies the `ItemStack` and/or `ItemMeta`.

Display-name property:

```java
public class DisplayNameProperty implements ItemProperty {

    private final String name;

    private DisplayNameProperty(String name) {
        this.name = name;
    }

    @Override
    public boolean canReplaceMaterial() { return false; }

    @Override
    public boolean isApplyMeta() { return true; }

    @Override
    public void apply(ItemStack item, ItemMeta meta, Player player, Menu menu) {
        meta.setDisplayName(name);
    }

    public static class Serializer implements NodeSerializer<DisplayNameProperty> {
        @Override
        public DisplayNameProperty deserialize(Class<DisplayNameProperty> type, ConfigNode node) {
            return new DisplayNameProperty(node.getString());
        }
    }
}
```

Material replacer (no params, just sets the type):

```java
public class CreeperHeadProperty implements ItemProperty {

    @Override
    public boolean canReplaceMaterial() { return true; }

    @Override
    public boolean isApplyMeta() { return false; }

    @Override
    public void apply(ItemStack item, ItemMeta meta, Player player, Menu menu) {
        item.setType(Material.CREEPER_HEAD);
    }

    public static class Serializer implements NodeSerializer<CreeperHeadProperty> {
        @Override
        public CreeperHeadProperty deserialize(Class<CreeperHeadProperty> type, ConfigNode node) {
            return new CreeperHeadProperty();
        }
    }
}
```

Register:

```java
api.itemProperties().register("creeperHead", CreeperHeadProperty.class, new CreeperHeadProperty.Serializer(), this);
```

## Catalog

A catalog provides a dynamic collection of objects to a generated menu. Each entry in the collection becomes one rendered item, and a `ValueExtractor` lets you read fields off each entry through placeholders.

The class implements [`Catalog<T>`](https://abstractmenus.github.io/api/ru/abstractmenus/api/Catalog.html):

```java
public class UserCatalog implements Catalog<User> {

    @Override
    public Collection<User> snapshot(Player player, Menu menu) {
        return List.of(
            new User("User 1", 17),
            new User("User 2", 18),
            new User("User 3", 19)
        );
    }

    @Override
    public ValueExtractor extractor() {
        return new UserExtractor();
    }

    public static class Serializer implements NodeSerializer<UserCatalog> {
        @Override
        public UserCatalog deserialize(Class<UserCatalog> type, ConfigNode node) throws NodeSerializeException {
            return new UserCatalog();
        }
    }
}
```

`snapshot` runs once per menu open (or per refresh). It can return an empty collection but never `null`.

Register and use:

```java
api.catalogs().register("users", UserCatalog.class, new UserCatalog.Serializer(), this);
```

```hocon
title: "Users"
size: 4

catalog {
  type: users
}

matrix {
  cells: [
    "_x_x_x_x_",
    "_x_x_x_x_",
    "_x_x_x_x_"
  ]
  templates {
    "x" {
      material: CAKE
      name: "%activator_user_name%"
      lore: "&7Age: &e%activator_user_age%"
    }
  }
}
```

If your catalog needs configuration (e.g. a filter), parse it from the `ConfigNode` in the serializer.

## Cleanup

Type registrations are dropped automatically when your addon disables. AbstractMenus tracks the owner you passed to `register(...)` and wipes everything tagged with that owner. You don't (and can't) call `unregister` from your addon.
