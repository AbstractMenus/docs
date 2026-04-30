---
title: Хендлеры провайдеров
description: Подключи свой бэкенд экономики, прав, уровней, плейсхолдеров или скинов через ProviderRegistry.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Разработчик аддонов</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 находится в alpha. API может измениться до стабильного релиза. Зафиксируй конкретную версию `compileOnly` в сборке, чтобы свежая выборка не сломала проект.
:::

:::note
Местами мы намеренно не следуем строгим Java-конвенциям, чтобы код был покороче. Здесь главное показать, как работает API, а не как писать продакшн-код.
:::

В AbstractMenus пять секций провайдеров: **экономика**, **права**, **уровни**, **плейсхолдеры**, **скины**. Каждая секция - это аксессор [`api.providers().<section>()`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/ProviderRegistry.java), возвращающий [`ProviderSection<T>`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/ProviderSection.java). В секцию можно зарегистрировать несколько хендлеров с id и приоритетом; какой из них становится дефолтным - выбирает оператор в `config.conf`. Если в HOCON-действии указан конкретный провайдер, он перебивает дефолт из конфига.

Старого статического фасада `Handlers` (как было до 2.0) больше нет - всё идёт через `ProviderSection`.

## Секции в двух словах

| Секция | Возвращает | Назначение |
|---|---|---|
| `api.providers().economy()` | `ProviderSection<EconomyHandler>` | `takeMoney`/`giveMoney`/`hasMoney` |
| `api.providers().permissions()` | `ProviderSection<PermissionsHandler>` | правила `permission`/`group`, мутация групп и нод |
| `api.providers().levels()` | `ProviderSection<LevelHandler>` | `giveXp`/`takeXp`/`giveLevel`/`takeLevel`, правила `xp`/`level` |
| `api.providers().placeholders()` | `ProviderSection<PlaceholderHandler>` | подстановка плейсхолдеров |
| `api.providers().skins()` | `ProviderSection<SkinHandler>` | `setSkin`/`resetSkin` |

Встроенные дефолты регистрируются с приоритетом **50**:

- **economy** - `vault` (Vault), `playerpoints` если установлен [PlayerPointsAddon](https://github.com/AbstractMenus/PlayerPointsAddon)
- **permissions** - `vault`, `luckperms`
- **levels** - `bukkit` (ванильный XP)
- **placeholders** - `papi` (PlaceholderAPI), `internal` (встроенные)
- **skins** - `skinsrestorer`

Аддонные провайдеры обычно регистрируются с приоритетом **100** - так они выигрывают авто-резолв, когда есть и дефолт, и аддон.

## Регистрация хендлера

Реализуй нужный интерфейс `*Handler` и зарегистрируй из `MenuExtension.onEnable(api)`:

```java
public final class MyAddon implements MenuExtension {

    @Override
    public void onEnable(AbstractMenusApi api) {
        api.providers().economy().register(
            "playerpoints",                          // id
            new PlayerPointsEconomy(playerPointsApi), // хендлер
            100,                                      // приоритет - больший выигрывает auto-резолв
            this);                                    // владелец - AbstractMenus использует для чистки
    }
}
```

`id` - это то, на что ссылаются HOCON-меню и `config.conf` (`provider: "playerpoints"`). Регистр не важен. Один и тот же экземпляр хендлера используется для всех вызовов.

## Резолв в рантайме

```java
EconomyHandler eco       = api.providers().economy().resolve();          // дефолт из конфига или хендлер с наивысшим приоритетом
EconomyHandler vault     = api.providers().economy().resolve("vault");   // по id, либо null
boolean hasPP            = api.providers().economy().has("playerpoints");
Set<String> ids          = api.providers().economy().ids();
Collection<EconomyHandler> all = api.providers().economy().all();
```

`resolve()` сначала смотрит в `config.conf providers.<section>`. Если оператор зафиксировал конкретный id - выиграет он. Если стоит `"auto"` - выиграет хендлер с наибольшим приоритетом. Поиск атомарен: параллельный `unregister` не вернёт устаревший хендлер.

`resolve(String)` дёргают действия меню, когда в HOCON прописан `provider: "..."`. Указание провайдера на уровне действия всегда перебивает дефолт из конфига.

## Пример: кастомный бэкенд экономики

Заменяем дефолтную экономику на свою - с балансами в `Map`:

```java
public final class MapEconomy implements EconomyHandler {

    private final Map<UUID, Double> balance = new ConcurrentHashMap<>();

    @Override
    public boolean hasBalance(Player player, double amount) {
        return balance.getOrDefault(player.getUniqueId(), 0.0) >= amount;
    }

    @Override
    public void takeBalance(Player player, double amount) {
        balance.merge(player.getUniqueId(), -amount,
                (current, delta) -> Math.max(0, current + delta));
    }

    @Override
    public void giveBalance(Player player, double amount) {
        balance.merge(player.getUniqueId(), amount, Double::sum);
    }
}
```

Регистрируем из аддона:

```java
@Override
public void onEnable(AbstractMenusApi api) {
    api.providers().economy().register(
        "memory",
        new MapEconomy(),
        100,
        this);
}
```

Чтобы сделать его серверным дефолтом, оператор пишет:

```hocon title="config.conf"
providers {
  economy = "memory"
}
```

Или точечно, на конкретное меню, не трогая глобальный дефолт:

```hocon
actions {
  click: [
    { type: takeMoney, amount: 100, provider: "memory" }
  ]
}
```

## Интерфейсы хендлеров

Все пять интерфейсов лежат в `ru.abstractmenus.api.handler.*`:

| Интерфейс | Методы |
|---|---|
| [`EconomyHandler`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/handler/EconomyHandler.java) | `hasBalance`, `takeBalance`, `giveBalance` |
| [`PermissionsHandler`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/handler/PermissionsHandler.java) | `addPermission`, `removePermission`, `hasPermission`, `addGroup`, `removeGroup`, `hasGroup` |
| [`LevelHandler`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/handler/LevelHandler.java) | `getXp`, `giveXp`, `takeXp`, `getLevel`, `giveLevel`, `takeLevel` |
| [`PlaceholderHandler`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/handler/PlaceholderHandler.java) | `replacePlaceholder`, `replace(Player, String)`, `replace(Player, List<String>)`, `registerAll` |
| [`SkinHandler`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/handler/SkinHandler.java) | `setSkin`, `resetSkin` |

Имена и сигнатуры методов стабильны в пределах всей линейки 2.0.

## Чистка

При `onDisable` твоего аддона AbstractMenus сам снимает все зарегистрированные тобой провайдеры. Самому `unregisterAll` дёргать нельзя - публичный `ProviderRegistry` его сознательно не выставляет, чтобы один аддон не мог сносить провайдеры другого.

Для Пути 1 чистка идёт сама собой: AbstractMenus ведёт его через `AddonManager` и при выключении сносит все регистрации. У Пути 2 "выключение" - это `JavaPlugin.onDisable`, и под автоматическую чистку он не попадает: регистрация остаётся в карте владельцев до выключения самого AbstractMenus. Повторная регистрация под тем же id из нового `onEnable` перетрёт живую запись - на практике утечки нет.
