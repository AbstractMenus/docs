---
title: Types deserializing
description: "AbstractMenus uses own wrappers over [original HOCON configuration library](https://github.com/lightbend/config). Javadocs for Configuration API, provided by…"
---

:::note
In many examples we do not adhere to some Java conventions and common code style to avoid boilerplate code. We want to show how to use API, and not how to write the proper code in Java.
:::

AbstractMenus uses own wrappers over [original HOCON configuration library](https://github.com/lightbend/config). Javadocs for Configuration API, provided by AbstractMenus, you can find [here](https://abstractmenus.github.io/api/).

Each menu type in AbstractMenus has own Deserializer. Deserializer is a simple [factory](https://en.wikipedia.org/wiki/Factory_method_pattern) that accepts some [ConfigNode](https://abstractmenus.github.io/api/ru/abstractmenus/hocon/api/ConfigNode.html) object and returns native Java type.

Each serializer should implement [NodeSerializer](https://abstractmenus.github.io/api/ru/abstractmenus/hocon/api/serialize/NodeSerializer.html) interface. This interface has only method to deserialize object from provided configuration node.

## Types registration

To register own serializer, you need to use [Types](https://abstractmenus.github.io/api/ru/abstractmenus/api/Types.html) manager. There are many methods to register and get serializer for some menu types, like action, rule, etc. But you also can register serializer for any type that you will use in future.

For this, you need to call `serializers()` method to get common serializers collection ([NodeSerializers](https://abstractmenus.github.io/api/ru/abstractmenus/hocon/api/serialize/NodeSerializers.html) class) that will be used in AbstractMenus.

To register your type serializer, you need to call method `register` of given `NodeSerializers` object. Example:

``` java
Types.serializers().register(MyType.class, new MyTypeSerializer());
```

How to register own menu types, like actions, rules, etc, you can read on `own_types` page.

:::caution
All registrations should be performed in `onLoad()` method. This because AbstractMenus loads all menus in `onEnable()` method and all types, used in menus, should be registered before.
:::

## Default serializers

AbstactMenus already has serializers for Java primitives and some most used objects:

- Boolean
- Integer
- Long
- Float
- Double
- String
- UUID

## Example 1. Deserialize simple object

Lets try to deserialize simple object of class, called `User`.

``` java
public class User {
    public String name;
    public int age;
}
```

And we have HOCON object like this:

```hocon
user {
  name: "Notch"
  age: 42
}
```

Now we need to create serializer for our type.

``` java
public class UserSerializer implements NodeSerializer<User> {

```hocon
@Override
public User deserialize(Class<User> type, ConfigNode node) throws NodeSerializeException {
    User user = new User();
    user.name = node.node("name").getString();
    user.age = node.node("age").getInt();
    return user;
}
```

}
```

`ConfigNode` provides access to parsed configuration structure. The only task when we create serializer is to read values from provided config node and write these values to our object.

## Example 2. Deserialize objects

Lets say we have such HOCON object:

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

We do not need to ask access to each child object and deserialize it manually. We already have serializer for `User` type. So lets use modify it to get `User` object from config node by calling one method.

First, we need to modify `User` class.

``` java
public class User {
    public String name;
    public int age;
    public User friend;
}
```

Then our `UserSerializer` will looks like this:

``` java
public class UserSerializer implements NodeSerializer<User> {

```hocon
@Override
public User deserialize(Class<User> type, ConfigNode node) throws NodeSerializeException {
    User user = new User();
    user.name = node.node("name").getString();
    user.age = node.node("age").getInt();
    user.friend = node.node("friend").getValue(User.class);
    return user;
}
```

}
```

Now when we call `getValue(User.class)` configuration api will find registered `UserSerializer` by `User` type and deserialize inner type.

:::caution
To use `getValue(User.class)` method, you need to register `UserSerializer` for `User` type, as described in `api-registration` part.
:::

## Example 3. Deserialize collections

HOCON supports lists of any type. In AbstractMenus API you also can get list of any type. In this example we will deserialize list of `User` objects.

Lets say we have such HOCON list:

```hocon
user {
  name: "Notch"
  age: 42
  friends: [
    {
      name: "Petya"
      age: 34
    },
    {
      name: "Alex"
      age: 38
    }
  ]
}
```

First, lets modify our `User` class. Now it should has friends list.

``` java
public class User {
    public String name;
    public int age;
    public List<User> friends;
}
```

Then our serializer will looks like this:

``` java
public class UserSerializer implements NodeSerializer<User> {

```hocon
@Override
public User deserialize(Class<User> type, ConfigNode node) throws NodeSerializeException {
    User user = new User();
    user.name = node.node("name").getString();
    user.age = node.node("age").getInt();
    user.friends = node.node("friends").getList(User.class);
    return user;
}
```

}
```

Now we called `getList(User.class)` method to get list of `User` objects.

You can get list of objects of any types. For example, when you need to get stirngs list, you just call `getList(String.class)`.
