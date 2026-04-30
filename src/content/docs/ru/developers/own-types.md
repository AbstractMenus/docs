---
title: Кастомные типы
description: Опиши и зарегистрируй свои действия, правила, свойства предметов, активаторы и каталоги.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Разработчик аддонов</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 находится в alpha. API может измениться до стабильного релиза. Зафиксируй конкретную версию `compileOnly` в сборке, чтобы свежая выборка не сломала проект.
:::

:::note
В примерах местами игнорируем строгие Java-конвенции - чтобы код был покороче. Здесь главное показать, как работает API, а не как писать прод.
:::

В AbstractMenus пять реестров типов, у всех одинаковая сигнатура `register(key, class, serializer, owner)`:

```java
api.actions().register("...", MyAction.class, new MyAction.Serializer(), this);
api.rules().register("...", MyRule.class, new MyRule.Serializer(), this);
api.itemProperties().register("...", MyProperty.class, new MyProperty.Serializer(), this);
api.activators().register("...", MyActivator.class, new MyActivator.Serializer(), this);
api.catalogs().register("...", MyCatalog.class, new MyCatalog.Serializer(), this);
```

Ключи нечувствительны к регистру. `owner` - твой экземпляр [`MenuExtension`](/docs/ru/developers/addons/); по нему AbstractMenus снимает твои регистрации при выключении аддона.

Для своих ключей бери вендорный префикс (`myaddon_action`, `playerpoints_take`) - чтобы будущая встроенная сущность с таким же именем не вступила в конфликт.

Регистрируй всё в `MenuExtension.onEnable(api)`. Из `onLoad` не регистрируй: аддоны, на которые ты опираешься, могут быть ещё не включены.

## Действие

Действие - то, что плагин делает: отправляет сообщение, выдаёт предмет, выполняет команду, открывает другое меню. Класс действия реализует [`Action`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/Action.java):

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

`clickedItem` может быть `null` - зависит от того, что запустило цепочку действий: клик или, например, цепочка deny-действий, сработавшая ещё до выбора предмета.

Регистрация:

```java
api.actions().register("myMessage", MessageAction.class, new MessageAction.Serializer(), this);
```

В файле меню:

```hocon
items: [
  {
    slot: 1
    material: STONE
    name: "Мой предмет"
    click {
      myMessage: "Привет! Это моё действие!"
    }
  }
]
```

## Правило

Правило - булева проверка по игроку. Реализует [`Rule`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/Rule.java):

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

Регистрация и использование:

```java
api.rules().register("isBob", IsBobRule.class, new IsBobRule.Serializer(), this);
```

```hocon
rules {
  isBob: true
}
```

Правило без параметров принимает в HOCON `true` - это сокращение для "правило активно". Правила с параметрами принимают ту HOCON-форму, которую парсит их сериализатор.

<a id="value-extractor"></a>

## Экстрактор значений

Экстрактор значений достаёт именованные значения из объекта контекста. Активаторы и каталоги используют его, чтобы пробрасывать данные контекста через плейсхолдеры.

Реализует [`ValueExtractor`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/ValueExtractor.java):

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

Сами экстракторы напрямую не регистрируются. Их экземпляр возвращает активатор или каталог из своего `getValueExtractor()` / `extractor()`.

По форме похоже на PlaceholderAPI, только тип контекста любой, не обязательно `Player`.

## Активатор

Активатор - слушатель событий, который открывает меню. Наследуется от абстрактного [`Activator`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/Activator.java), а тот - от Bukkit-овского `Listener`. Внутри слушай любое нужное Bukkit-событие:

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

`openMenu(ctx, player)` открывает меню, к которому привязан активатор. `ctx` - контекст открытия, или `null`, если контекста нет.

:::caution
Сам в Bukkit-е листенер не регистрируй. AbstractMenus делает это сам, когда активатор привязан к меню.
:::

Регистрация активатора:

```java
api.activators().register("onSneak", SneakActivator.class, new SneakActivator.Serializer(), this);
```

### Активатор с контекстом

В `ctx` можно положить любой объект, а его поля прокинуть через `ValueExtractor`. В примере ниже контекстом идёт точка респауна, `LocationExtractor` делает её координаты доступными как `%activator_loc_x%` и т.д.:

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
title: "Тест"
size: 1
activators {
  onRespawn: true
}
items: [
  {
    slot: 4
    material: CAKE
    name: "Тестовый предмет"
    lore: [
      "Loc x: %activator_loc_x%",
      "Loc y: %activator_loc_y%",
      "Loc z: %activator_loc_z%"
    ]
  }
]
```

## Свойство предмета

Свойство предмета меняет его внешний вид - имя, лор, материал, custom model data и т.д.

Реализуй [`ItemProperty`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/inventory/ItemProperty.java):

- **`canReplaceMaterial`** - возвращает `true`, если свойство меняет материал. Такие свойства выполняются первыми, чтобы дальше остальные работали уже с валидной `ItemMeta`.
- **`isApplyMeta`** - возвращает `true`, если после `apply` AbstractMenus должен сам вызвать `setItemMeta` на стеке. Возвращай `false`, если `apply` уже разбирается с meta самостоятельно.
- **`apply`** - модифицирует `ItemStack` и/или `ItemMeta`.

Свойство для имени:

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

Подмена материала (параметров нет, просто проставляет тип):

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

Регистрация:

```java
api.itemProperties().register("creeperHead", CreeperHeadProperty.class, new CreeperHeadProperty.Serializer(), this);
```

## Каталог

Каталог отдаёт генерируемому меню динамическую коллекцию объектов. Каждая запись становится своим предметом в меню, а `ValueExtractor` даёт доступ к её полям через плейсхолдеры.

Класс реализует [`Catalog<T>`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/Catalog.java):

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

`snapshot` дёргается один раз на открытие меню (или на refresh). Может вернуть пустую коллекцию, но не `null`.

Регистрация и использование:

```java
api.catalogs().register("users", UserCatalog.class, new UserCatalog.Serializer(), this);
```

```hocon
title: "Пользователи"
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
      lore: "&7Возраст: &e%activator_user_age%"
    }
  }
}
```

Если каталогу нужна конфигурация (фильтр и т.п.), парси её из `ConfigNode` в сериализаторе.

## Чистка

Регистрации типов снимаются автоматически при выключении аддона. AbstractMenus запоминает владельца из `register(...)` и сносит всё, что помечено этим владельцем. Самому `unregister` дёргать нельзя.
