---
title: HOCON serializers
description: Deserialize your own types from HOCON menu configs.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Addon developer</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 is in alpha. The API surface may change before the stable release. Pin a specific `compileOnly` version in your build to avoid breaking on a fresh fetch.
:::

:::note
In many examples we don't follow strict Java conventions to keep the code short. We're showing how the API works, not how to write production code.
:::

AbstractMenus uses its own wrappers over the [Lightbend HOCON config library](https://github.com/lightbend/config). A serializer is a small factory that takes a [`ConfigNode`](https://abstractmenus.github.io/api/ru/abstractmenus/hocon/api/ConfigNode.html) and returns a Java object.

Each serializer implements [`NodeSerializer<T>`](https://abstractmenus.github.io/api/ru/abstractmenus/hocon/api/serialize/NodeSerializer.html). The interface has one method: `deserialize(Class<T> type, ConfigNode node)`.

## When you need to register a serializer

You usually don't need to register a serializer manually. The five `register(...)` calls on the type registries (action, rule, item-property, activator, catalog) accept a `NodeSerializer<S>` and wire it into the shared `NodeSerializers` collection automatically.

The case where you *do* register a serializer manually: when you want to deserialize a custom *parameter object* used by your action or rule, so HOCON parsing can read it nested inside another structure via `node.getValue(MyType.class)`.

```java
api.serializers().register(MyType.class, new MyTypeSerializer());
```

Do this from `MenuExtension.onEnable(api)`. By the time `onEnable` returns for your addon, AbstractMenus is still pre-menu-load, so any types you register are available when menus parse.

## Default serializers

AbstractMenus ships serializers for Java primitives and a few common types out of the box:

- `Boolean`
- `Integer`
- `Long`
- `Float`
- `Double`
- `String`
- `UUID`

Plus its own value types: `TypeBool`, `TypeInt`, `TypeDouble`, `TypeString`, `TypeMaterial`, `TypeLocation`, `TypeSlot`, etc.

## Example 1. Deserialize a simple object

```java
public class User {
    public String name;
    public int age;
}
```

```hocon
user {
  name: "Notch"
  age: 42
}
```

```java
public class UserSerializer implements NodeSerializer<User> {

    @Override
    public User deserialize(Class<User> type, ConfigNode node) throws NodeSerializeException {
        User user = new User();
        user.name = node.node("name").getString();
        user.age = node.node("age").getInt();
        return user;
    }
}
```

`ConfigNode` is the parsed structure. The serializer reads named fields off `node` and copies them into the target type.

## Example 2. Deserialize nested objects

If a field of your type is itself a serializable type, call `getValue(SomeType.class)` and let the registered serializer for `SomeType` do the work:

```hocon
user {
  name: "Notch"
  age: 42
  friend {
    name: "Alex"
    age: 38
  }
}
```

```java
public class User {
    public String name;
    public int age;
    public User friend;
}
```

```java
public class UserSerializer implements NodeSerializer<User> {

    @Override
    public User deserialize(Class<User> type, ConfigNode node) throws NodeSerializeException {
        User user = new User();
        user.name = node.node("name").getString();
        user.age = node.node("age").getInt();
        user.friend = node.node("friend").getValue(User.class);
        return user;
    }
}
```

`getValue(User.class)` looks up the registered `UserSerializer` and runs it on the nested node. Make sure `UserSerializer` is registered before any HOCON that references it parses, otherwise `getValue` throws.

## Example 3. Deserialize collections

HOCON supports lists. The API supports lists of any registered type.

```hocon
user {
  name: "Notch"
  age: 42
  friends: [
    { name: "Petya", age: 34 },
    { name: "Alex",  age: 38 }
  ]
}
```

```java
public class User {
    public String name;
    public int age;
    public List<User> friends;
}
```

```java
public class UserSerializer implements NodeSerializer<User> {

    @Override
    public User deserialize(Class<User> type, ConfigNode node) throws NodeSerializeException {
        User user = new User();
        user.name = node.node("name").getString();
        user.age = node.node("age").getInt();
        user.friends = node.node("friends").getList(User.class);
        return user;
    }
}
```

`getList(SomeType.class)` works for any type that has a registered serializer, including primitives. `node.getList(String.class)` returns a `List<String>`.

## ConfigNode shortcuts

`ConfigNode` exposes the common reads you'd expect:

```java
node.getString()                // primitive string
node.getString("default")       // primitive string with default
node.getInt()
node.getInt(0)
node.getBoolean()
node.getDouble()
node.getList(String.class)
node.isNull()
node.isPrimitive()
node.isMap()
node.isList()

node.node("path")               // child node by key (supports dotted paths)
node.children()                 // iterate children of a map node
node.getValue(MyType.class)     // run the registered serializer
node.getValue(MyType.class, fallback)
```

`isNull()` is the cheapest way to probe whether an optional field exists. The convention is: `node.node("optional").isNull() ? defaultValue : node.node("optional").getInt()`.
