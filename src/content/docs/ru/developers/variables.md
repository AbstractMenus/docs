---
title: Variables API
description: Чтение и запись персональных и глобальных переменных программно.
---

<div class="audience-tags"><span class="audience-tag audience-developer">Разработчик аддонов</span></div>

:::caution[Alpha API]
AbstractMenus 2.0 находится в alpha. API может измениться до стабильного релиза. Зафиксируй конкретную версию `compileOnly` в сборке, чтобы свежая выборка не сломала проект.
:::

:::note
В примерах местами игнорируем строгие Java-конвенции - чтобы код был покороче. Здесь главное показать, как работает API, а не как писать прод.
:::

В AbstractMenus есть небольшое CRUD API для тех же переменных, которые авторы меню крутят через `/var` и `/varp`. Javadoc: [api/variables](https://github.com/AbstractMenus/minecraft-plugin/tree/master/api/src/main/java/ru/abstractmenus/api/variables).

## `Var`

[`Var`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/variables/Var.java) - это запись одной переменной. Значения хранятся строками, но у `Var` есть типизированные аксессоры, которые парсят при чтении (могут бросить, если в строке не валидное число).

Срок жизни хранится в миллисекундах UTC. Чтобы понять, жива ли переменная, сравни `expiry()` с `System.currentTimeMillis()`. `expiry() == 0` - "без срока".

## `VariableManager`

[`VariableManager`](https://github.com/AbstractMenus/minecraft-plugin/blob/master/api/src/main/java/ru/abstractmenus/api/variables/VariableManager.java) - точка входа в CRUD. Достаём из API:

```java
AbstractMenusApi api = AbstractMenusApi.get();
VariableManager vars = api.variables();
```

Имена переменных и игроков, которые ты отдаёшь менеджеру, нечувствительны к регистру - руками в lowercase приводить не нужно.

## Создание переменной

```java
Var var = api.variables().createBuilder()
        .name("welcome_message")
        .value("Привет!")
        .expiry(System.currentTimeMillis() + 10_000) // истекает через 10 секунд
        .build();

api.variables().saveGlobal(var);
```

Для персональных переменных - `savePersonal(playerName, var)`.

`expiry(0)` (либо просто не звать `.expiry(...)`) делает переменную бессрочной.

## Чтение и удаление

```java
Var welcome = api.variables().getGlobal("welcome_message");
Var claimed = api.variables().getPersonal(player.getName(), "dailyReward");

api.variables().deleteGlobal("welcome_message");
api.variables().deletePersonal(player.getName(), "dailyReward");
```

`getGlobal` и `getPersonal` возвращают `null`, если переменной нет или она истекла и уже подметена. Имена переменных и игроков сравниваются без учёта регистра.

## Аксессоры Var

`Var` хранит значения строками, но отдаёт типизированные аксессоры, которые парсят на лету:

```java
Var counter = vars.getPersonal(player.getName(), "kills");
int kills   = counter.intValue();    // бросит, если значение не int
long ts     = counter.longValue();
boolean on  = counter.boolValue();
double pct  = counter.doubleValue();
float rate  = counter.floatValue();
```

Для временных переменных есть `Var#hasExpiry()` и `Var#isExpired()`. Чтобы получить новую переменную на основе существующей (например, продлить срок), используй `Var#toBuilder()`.
