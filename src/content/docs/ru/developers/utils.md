---
title: Утилиты
description: Хелперы цвета, подстановка плейсхолдеров, планировщик.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Разработчик аддонов</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 находится в alpha. API может измениться до стабильного релиза. Зафиксируй конкретную версию `compileOnly` в сборке, чтобы свежая выборка не сломала проект.
:::

Маленькие хелперы, которые аддонам нужны постоянно.

## Замена цветовых кодов

`Colors.of(String)` превращает легаси-коды с `&` (`&a`, `&l` и т.п.), коды с section-sign (`§a`) и hex-коды в HTML-стиле (`<#FFAA00>`) в формат с section-sign, который понимает Minecraft. Если в `config.conf` включён `useMiniMessage`, распознаются ещё и теги MiniMessage (`<red>`, `<rainbow>`, `<click:run_command:/foo>`).

```java
import ru.abstractmenus.api.text.Colors;

String coloured = Colors.of("&aПривет, &b%player_name%&a!");
```

`Colors.of` возвращает строку, готовую для `player.sendMessage(...)`.

## Подстановка плейсхолдеров

Секция плейсхолдеров в реестре провайдеров одинаково ровно жуёт встроенные плейсхолдеры (`%player_name%`, `%activator_*%` и т.п.) и токены PlaceholderAPI:

```java
PlaceholderHandler ph = api.providers().placeholders().resolve();
String resolved = ph.replace(player, "Привет, %player_name%!");
List<String> resolvedLore = ph.replace(player, lore);
```

`replace(Player, String)` - однострочная форма для отображаемых имён, заголовков, аргументов действий. `replace(Player, List<String>)` - многострочная, под лор предметов. Обе нормально переживают `null` и пустой ввод и ничего не кидают: если бэкенд упал, на выход уйдёт исходная строка.

## Планировщик для сущностей на Folia

Если ты из планируемой задачи трогаешь игрока или другую сущность, а сервер на Folia, глобальный региональный планировщик трогать состояние сущностей не имеет права. Для таких случаев у AbstractMenus есть Folia-aware хелперы в `BukkitTasks` (живут в plugin-модуле, не в api):

```java
BukkitTasks.runForEntity(player, () -> player.updateInventory());
BukkitTasks.runForEntityLater(player, () -> player.kick(reason), 20L);
BukkitTasks.runForEntityTimer(player, () -> player.giveExp(1), 20L, 20L);
```

Для задач вне контекста сущности у `BukkitTasks` есть привычные формы планировщика:

```java
BukkitTasks.runTask(() -> doWork());
BukkitTasks.runTaskAsync(() -> hitDatabase());
BukkitTasks.runTaskLater(() -> notify(), 40L);
BukkitTasks.runTaskLaterAsync(() -> upload(), 40L);
BukkitTasks.runTaskTimer(() -> tick(), 0L, 20L);
BukkitTasks.runTaskTimerAsync(() -> poll(), 0L, 20L);

if (BukkitTasks.isFolia()) {
    // ветка, где нужен entity-aware планировщик
}
```

На Spigot/Paper без Folia они откатываются в обычный Bukkit-планировщик. На Folia entity-варианты уходят в регион-владелец сущности (единственный поток, которому можно менять её состояние), а глобальные - в global region scheduler.

Если ты сидишь только на api, без plugin-модуля, делай то же самое руками: ветвись по детекту Folia и зови `Bukkit.getRegionScheduler()` / `getEntityScheduler()` напрямую.

## Прочие точки доступа

```java
Plugin am = api.getPlugin();           // сырой хэндл Bukkit Plugin (экземпляр AbstractMenus)
String version = api.apiVersion();     // например "2.0.0-alpha.2"
```

`getPlugin()` пригодится, когда какому-то Bukkit API нужна ссылка `Plugin`, а своей у тебя нет (например, надо повесить листенер под владельцем плагина AbstractMenus). По возможности используй собственный дескриптор плагина - иначе листенер, повешенный от имени AbstractMenus, переживёт твой `onDisable`.

## Логирование

Чтобы лог шёл единообразно и с префиксом AbstractMenus, используй `Logger`:

```java
import ru.abstractmenus.api.Logger;

Logger.info("Addon ready");
Logger.warning("Skipped quest entry: invalid id");
Logger.severe("Catalog snapshot failed", throwable);
```

Под капотом он пишет через `java.util.logging.Logger` хост-плагина, поэтому в консоли сообщения идут с префиксом `[AbstractMenus]`, кто бы их ни кинул. Обычный `System.out.println` тоже работает, но без тега.
