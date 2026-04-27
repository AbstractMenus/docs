---
title: Create own types
description: "AbstractMenus gives access to create own Action, Rule, Item property, and Catalog."
---

:::note
In many examples we do not adhere to some Java conventions and common code style to avoid boilerplate code. We want to show how to use API, and not how to write the proper code in Java.
:::

AbstractMenus gives access to create own Action, Rule, Item property, and Catalog.

## Create Action

Each action class must implement the [Action](https://abstractmenus.github.io/api/ru/abstractmenus/api/Action.html) interface.

``` java
public class MyAction implements Action {
    @Override
    public void activate(Player player, Menu menu, Item clickedItem) {
        player.sendMessage("Hello! This is my action!");
    }
}
```

This is the simplest example. Note that `clickedItem` can be `null`. It depends on what triggered the action call - a click on an item, or something else.

As written on `serializers` page, each action must have its own serializer. Let's add it.

``` java
public class MyAction implements Action {

```hocon
private final String text;

private MyAction(String text) {
    this.text = text;
}

@Override
public void activate(Player player, Menu menu, Item clickedItem) {
    player.sendMessage(text);
}

public static class Serializer implements NodeSerializer<MyAction> {

    @Override
    public MyAction deserialize(Class<MyAction> type, ConfigNode node) {
        return new MyAction(node.getString());
    }
}
```

}
```

Now our action can take a string parameter and send it in a message to the player. To register our action, we need a [Types](https://abstractmenus.github.io/api/ru/abstractmenus/api/Types.html) manager. To register action you need to call `registerAction` method which requires some arguments:

1.  Action name. This name must be unique and will be used in menu configuration.
2.  Action class. In our case this is `MyAction.class`.
3.  Serializer instance.

``` java
Types.registerAction("myAction", MyAction.class, new MyAction.Serializer());
```

Here `myAction` is the key of our action. This is how it might be used in a menu file:

```hocon
items: [
  {
    slot: 1
    material: STONE
    name: "My item"
    click {
      myAction: "Hello! This is my action!"
    }
  }
]
```

## Create Rule

Each rule implements the [Rule](https://abstractmenus.github.io/api/ru/abstractmenus/api/Rule.html) interface. It contains one method, which, depending on the check, can return `true` (the player matches the rule) or `false` (the player doesn't matches the rule).

``` java
public class MyRule implements Rule {
    @Override
    public boolean check(Player player, Menu menu, Item clickedItem) {
        return player.getName().equals("Bob");
    }
}
```

In this case, the rule will return `false` if player's name is not `Bob`. The creation of a serializer is exactly the same as for Action.

``` java
public class MyRule implements Rule {

```hocon
@Override
public boolean check(Player player, Menu menu, Item clickedItem) {
    return player.getName().equals("Bob");
}

public static class Serializer implements NodeSerializer<MyRule> {

    @Override
    public MyRule deserialize(Class<MyRule> type, ConfigNode node) {
        return new MyRule();
    }
}
```

}
```

Here we decided not to avoid parameters. Our rule will just check the player's username.

Registration is similar to an Action, but calling `registerRule` method.

``` java
Types.registerRule("myRule", MyRule.class, new MyRule.Serializer());
```

Since our rule does not accept any parameters, when specifying it in the menu file, we can simply specify `true`.

```hocon
rules {
  myRule: true
}
```

This applies to all registered actions, rules, etc., which have no parameters.

## Create Value Extractor

Value extractors used by Activators and Catalogs, so before learn how to make them, you need to know how to make extractor.

Value extractor is an object that takes some object and placeholder. By provided placeholder extractor returns some values from provided object.

Each value extractor should implement [ValueExtractor](https://abstractmenus.github.io/api/ru/abstractmenus/api/ValueExtractor.html) interface. This interface has single method with two arguments:

1.  Object context
2.  Placeholder string

Lets create simple value extractor. For example, we have some class:

``` java
public class User {
    public String name;
    public int age;
    public int friends;
}
```

To get some value from object of this class, we create extractor like this:

``` java
public class UserExtractor implements ValueExtractor {

```hocon
@Override
public String extract(Object obj, String placeholder) {
    if (obj instanceof User) {
        User user = (User) obj;

        switch (placeholder) {
            case "user_name": return user.name;
            case "user_age": return String.valueOf(user.age);
            case "user_friends": return String.valueOf(user.friends);
        }
    }
    return null;
}
```

}
```

First, we cast object to `User`. Then depends on placeholder we returned requested value from this object.

This API similar to PlaceholderAPI, but it can accept any type, not only `Player`.

Value exractors are not registered, like actions or rules. Each menu element whoch uses it, should provide extractor instance. You will understood how it works after reading next parts of this page.

## Create Activator

Each activator extends from the abstract class [Activator](https://abstractmenus.github.io/api/ru/abstractmenus/api/Activator.html). It has no abstract methods to implement. This class is implemented from the Bukkit's `Listener` interface, so inside you can listen for events, the calling of which will open the menu.

:::caution
Do not register activator as listener manually. The plugin will do it automatically.
:::

``` java
public class MyActivator extends Activator {

```hocon
@EventHandler
public void onSneak(PlayerToggleSneakEvent event) {
    if (event.isSneaking()) {
        openMenu(null, event.getPlayer());
    }
}

public static class Serializer implements NodeSerializer<MyActivator> {

    @Override
    public MyActivator deserialize(Class<MyActivator> type, ConfigNode node) {
        return new MyActivator();
    }
}
```

}
```

The `openMenu` method is a part of the `Activator` class. It opens the menu in which this activator is located. In this case, we open the menu if the player toggles sneak on. This method takes two arguments:

- **`ctx`** - The context of activator. Can be null if there no any context value.

- **`player`** - Player for who we menu will be opened

How to add context to activator, you can read in [section below](api-types-ctx).

Registration of activator similar to other menu types, but using `registerActivator` method.

``` java
Types.registerActivator("myActivator", MyActivator.class, new MyActivator.Serializer());
```

### Activator with context

Activator's context is any object that saves before opening menu. After menu opened, you can get access to some context value through value extractor's placeholders.

To create activator with context, you need to specify required object when you call `openMenu` method.

``` java
public class MyActivator extends Activator {

```hocon
@EventHandler
public void onRespawn(PlayerRespawnEvent event) {
    openMenu(event.getRespawnLocation(), event.getPlayer());
}
```

}
```

Here, we specified location in which player respawned as context. To provide access to context values (in our case this is `Location` object), we need to create Value Extractor. This process described [here](api-extractor). We will create simple extractor for `Location` object.

```java
public class LocationExtractor implements ValueExtractor {

    @Override
    public String extract(Object obj, String placeholder) {
        if (obj instanceof Location) {
            Location loc = (Location) obj;

            switch (placeholder) {
                case "loc_x": return String.valueOf(loc.getX());
                case "loc_y": return String.valueOf(loc.getY());
                case "loc_z": return String.valueOf(loc.getZ());
            }
        }
        return null;
    }
}
```

Now we need to return our extractor in overrided `getValueExtractor` method.

``` java
public class MyActivator extends Activator {

```hocon
@EventHandler
public void onRespawn(PlayerRespawnEvent event) {
    openMenu(event.getRespawnLocation(), event.getPlayer());
}

@Override
public ValueExtractor getValueExtractor() {
    return new LocationExtractor();
}
```

}
```

Now, we need to register activator.

``` java
Types.registerActivator("myActivator", MyActivator.class, new MyActivator.Serializer());
```

After this, we can use this activator in menu.

```hocon
title: "Test"
size: 1
activators {
  myActivator: true
}
items: [
  {
    slot: 4
    material: CAKE
    name: "Test item"
    lore: [
      "Loc x: %activator_loc_x%",
      "Loc y: %activator_loc_y%"
      "Loc z: %activator_loc_z%"
    ]
  }
]
```

## Create Item Property

An item property is an object that modify item appearance.

To create new item property, you need to implement [ItemProperty](https://abstractmenus.github.io/api/ru/abstractmenus/api/inventory/ItemProperty.html) interface. There is several methods to implement:

- **`canReplaceMaterial`** - Does this property modify item type (material installer). If `true`, then plugin will apply this property first, to generate valid item meta.

- **`isApplyMeta`** - If return `false`, plugin won't apply saved meta after exiting from `apply` method. Return `true` if you don't set own meta to provided ItemStack.

- **`apply`** - Apply properties to ItemStack or ItemMeta.

Example:

``` java
public class MyProperty implements ItemProperty {

```hocon
private final String name;

private MyProperty (String name) {
    this.name = name;
}

@Override
public boolean canReplaceMaterial() {
    return false;
}

@Override
public boolean isApplyMeta() {
    return true;
}

@Override
public void apply(ItemStack item, ItemMeta meta, Player player, Menu menu) {
    meta.setDisplayName(name);
}

public static class Serializer implements NodeSerializer<MyProperty> {

    @Override
    public MyProperty deserialize(Class<MyProperty> type, ConfigNode node) {
        return new MyProperty(node.getString());
    }
}
```

}
```

Another example with a material replacer. Here we give out the creeper head. This property has no parameters, so we can simply specify `true` instead of any parameters.

``` java
public class MyMaterialProperty implements ItemProperty {

```hocon
@Override
public boolean canReplaceMaterial() {
    return true;
}

@Override
public boolean isApplyMeta() {
    return false;
}

@Override
public void apply(ItemStack item, ItemMeta meta, Player player, Menu menu) {
    item.setType(Material.CREEPER_HEAD);
}

public static class Serializer implements NodeSerializer<MyMaterialProperty> {

    @Override
    public MyMaterialProperty deserialize(Class<MyMaterialProperty> type, ConfigNode value) {
        return new MyMaterialProperty();
    }
}
```

}
```

After we created item property, we eed to register it.

``` java
Types.registerItemProperty("myProperty", MyMaterialProperty.class, new MyMaterialProperty.Serializer());
```

## Create Catalog

When menu opens, catalog provides collection of objects. Also catalog must return [Value Extractor](api-extractor) to provide access to object properties through placeholders.

To create catalog you need:

1.  The class, objects of which you will provide.
2.  Value extractor for this type.
3.  Implement catalog which returns collection of your objects and provides.
4.  Make serializer for catalog.

For example, we have such type:

``` java
public class User {
    public String name;
    public int age;

```hocon
public User(String  name, int age) {
    this.name = name;
    this.age = age;
}
```

}
```

Then we create simple extractor for this type.

``` java
public class UserExtractor implements ValueExtractor {
    @Override
    public String extract(Object obj, String placeholder) {
        if (obj instanceof User) {
            User user = (User) obj;

            switch (placeholder) {
                case "user_name": return user.name;
                case "user_age": return String.valueOf(user.age);
            }
        }
        return null;
    }
}
```

When we have type and extractor for this type, we can create catalog. Each catalog implements [Catalog](https://abstractmenus.github.io/api/ru/abstractmenus/api/Catalog.html) interface.

``` java
public class UserCatalog implements Catalog<User> {

```hocon
@Override
public Collection<User> snapshot(Player player, Menu menu) {
    return Arrays.asList(
            new User("User 1", 17),
            new User("User 2", 18),
            new User("User 3", 19),
            new User("User 4", 20),
            new User("User 5", 21),
            new User("User 6", 22)
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
```

}
```

The `snapshot` method should return collection of your objects. This collection can be empty, but shouldn't be `null`.

Now we can register it.

``` java
Types.registerCatalog("my_catalog", MyCatalog.class, new MyCatalog.Serializer());
```

After this, we can use our catalog in menu.

```hocon
title: "Test menu"
size: 4

catalog {
  type: my_catalog
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

If you need to add additional parameters to catalog, you can parse it from `catalog` block. This block is provided `ConfigNode` in serializer.
