---
title: HOCON-сериализаторы
description: Десериализация своих типов из HOCON-конфигов меню.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Разработчик аддонов</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 находится в alpha. API может измениться до стабильного релиза. Зафиксируй конкретную версию `compileOnly` в сборке, чтобы свежая выборка не сломала проект.
:::

:::note
В примерах местами игнорируем строгие Java-конвенции - чтобы код был покороче. Здесь главное показать, как работает API, а не как писать прод.
:::

AbstractMenus оборачивает [HOCON-библиотеку Lightbend](https://github.com/lightbend/config) своими обёртками. Сериализатор - простая фабрика: принимает [`ConfigNode`](https://github.com/AbstractMenus/hocon/blob/master/src/main/java/ru/abstractmenus/hocon/api/ConfigNode.java), возвращает Java-объект.

Каждый сериализатор реализует [`NodeSerializer<T>`](https://github.com/AbstractMenus/hocon/blob/master/src/main/java/ru/abstractmenus/hocon/api/serialize/NodeSerializer.java) - в интерфейсе один метод: `deserialize(Class<T> type, ConfigNode node)`.

## Когда нужно регистрировать сериализатор

Обычно регистрировать сериализатор руками не приходится. Пять вызовов `register(...)` на реестрах типов (action, rule, item-property, activator, catalog) принимают `NodeSerializer<S>` и сами кладут его в общую коллекцию `NodeSerializers`.

Регистрировать руками нужно тогда, когда у тебя есть кастомный *объект-параметр*, которым пользуется твоё действие или правило, и его надо уметь читать вложенным в другую структуру через `node.getValue(MyType.class)`.

```java
api.serializers().register(MyType.class, new MyTypeSerializer());
```

Регистрируй из `MenuExtension.onEnable(api)`. К моменту, когда твой `onEnable` отработает, AbstractMenus ещё не успел загрузить меню - значит, всё, что ты зарегистрировал, попадёт в парсинг.

## Дефолтные сериализаторы

Из коробки в AbstractMenus есть сериализаторы для Java-примитивов и нескольких ходовых типов:

- `Boolean`
- `Integer`
- `Long`
- `Float`
- `Double`
- `String`
- `UUID`

Плюс свои типы значений: `TypeBool`, `TypeInt`, `TypeDouble`, `TypeString`, `TypeMaterial`, `TypeLocation`, `TypeSlot` и т.д.

## Пример 1. Десериализация простого объекта

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

`ConfigNode` - распарсенная HOCON-структура. Сериализатор читает у `node` именованные поля и заливает их в целевой тип.

## Пример 2. Десериализация вложенных объектов

Если у поля свой сериализатор - просто зови `getValue(SomeType.class)`, и зарегистрированный сериализатор `SomeType` отработает сам:

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

`getValue(User.class)` найдёт зарегистрированный `UserSerializer` и натравит его на вложенную ноду. Главное, чтобы `UserSerializer` был зарегистрирован до парсинга HOCON, который на него ссылается - иначе `getValue` кинет исключение.

## Пример 3. Десериализация коллекций

В HOCON есть списки. API умеет их для любого зарегистрированного типа.

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

`getList(SomeType.class)` работает для любого типа с зарегистрированным сериализатором, в том числе для примитивов. `node.getList(String.class)` вернёт `List<String>`.

## Шорткаты ConfigNode

У `ConfigNode` ожидаемый набор методов чтения:

```java
node.getString()                // примитив-строка
node.getString("default")       // примитив-строка со значением по умолчанию
node.getInt()
node.getInt(0)
node.getBoolean()
node.getDouble()
node.getList(String.class)
node.isNull()
node.isPrimitive()
node.isMap()
node.isList()

node.node("path")               // дочерняя нода по dotted-пути (один или несколько сегментов)
node.child("name")              // одношаговый поиск ребёнка
node.childrenList()             // List<ConfigNode> для нод-списков
node.childrenMap()              // Map<String, ConfigNode> для нод-карт
node.hasChildren()
node.key()                      // имя этой ноды в родителе
node.path()                     // полный dotted-путь от корня
node.parent()                   // родительский ConfigNode или null
node.getValue(MyType.class)     // запустить зарегистрированный сериализатор
node.getValue(MyType.class, fallback)
```

`isNull()` - самый дешёвый способ проверить, есть ли опциональное поле. Стандартный паттерн: `node.node("optional").isNull() ? defaultValue : node.node("optional").getInt()`.

С нодами-списками и нодами-картами постоянно используешь `childrenList()` / `childrenMap()` - именно так встроенные сериализаторы обходят предметы, действия и биндинги.
