---
title: Действия
description: "Действие - это то, что плагин выполнит после события: клик по предмету, открытие меню и т.д. Ниже полный список."
---

<div class="audience-tags"><span class="audience-tag audience-author">Автор меню</span></div>

Действие - это то, что плагин выполнит после события: клик по предмету, открытие меню и т.д. Ниже полный список.

## Все действия

| Название | Тип данных | Описание |
|----|----|----|
| openMenu | String | Открыть меню с указанным именем |
| openMenuCtx | String | То же, что `openMenu`, но передаёт [контекст](/docs/ru/advanced/input/) от активатора предыдущего меню |
| closeMenu | Boolean или Number | Закрыть текущее меню. Если вместо boolean указано число, меню закроется после задержки в указанных тиках |
| refreshMenu | Boolean или Number | Обновить всё содержимое меню кроме заголовка. Если вместо boolean указано число, меню обновится после задержки в указанных тиках |
| [message](#message) | Object или String | Отправить сообщение игроку. Можно отправить простой текст, JSON, title и др. |
| [broadcast](#message) | Object или String | Отправить сообщение всем игрокам на сервере. Формат как у `message` |
| [miniMessage](#message) | String | **(Устарело. MiniMessage теперь поддерживается стандартными message-действиями)** Отправить сообщение через `mini-message` |
| playerChat | Список строк | Отправить сообщение от лица игрока, который открыл меню |
| print | String | Вывести сообщение в консоль. Полезно для отладки |
| [command](#command) | Object | Выполнить список команд от лица игрока или сервера |
| [inputChat](#chat-input) | Object | Запросить у игрока ввод текста в чат и сохранить результат в переменную |
| [teleport](#teleport) | Object | Телепортировать игрока в локацию |
| [itemAdd](#add-item) | Список объектов | Выдать игроку любые предметы |
| [itemRemove](#remove-item) | Список объектов | Удалить предметы из инвентаря игрока. Сравнение по указанным свойствам или просто по номеру слота |
| [itemClear](#remove-item) | Список объектов | Удалить предметы из инвентаря игрока так же, как `itemRemove`, но без учёта размера стака. Свойство `count` здесь не работает |
| inventoryClear | Boolean | Полностью очистить инвентарь игрока |
| bungeeConnect | String | Подключить игрока к другому BungeeCord-серверу |
| [giveMoney](#provider-selection) | Number или Object | Начислить деньги. |
| [takeMoney](#provider-selection) | Number или Object | Снять деньги. |
| [givePermission](#provider-selection) | Список строк или Object | Выдать право. |
| [removePermission](#provider-selection) | Список строк или Object | Отозвать право. |
| [addGroup](#provider-selection) | String или Object | Добавить в группу прав. |
| [removeGroup](#provider-selection) | String или Object | Убрать из группы прав. |
| [lpMetaSet](#lp-meta) | Object | Только для LuckPerms: задать meta-значения (`metaList`). Если активный провайдер прав не LuckPerms - пишет warning и пропускает. |
| [lpMetaRemove](#lp-meta) | Список строк | Только для LuckPerms: удалить meta-ключи. Если активный провайдер прав не LuckPerms - пишет warning и пропускает. |
| setGamemode | String | Установить новый режим игры. Все имена режимов [здесь](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/GameMode.html) |
| setHealth | Number | Установить здоровье игрока |
| setFoodLevel | Number | Установить уровень еды игрока |
| [giveXp](#provider-selection) | Number или Object | Выдать XP. |
| [takeXp](#provider-selection) | Number или Object | Снять XP. |
| [giveLevel](#provider-selection) | Number или Object | Повысить уровень. |
| [takeLevel](#provider-selection) | Number или Object | Понизить уровень. |
| [sound](#sound) | Object | Проиграть звук |
| [customSound](#custom-sound) | Object | Проиграть кастомный звук из ресурспака |
| [potionEffect](#add-potion-effect) | Список объектов | Наложить на игрока эффект зелья |
| [removePotionEffect](#remove-potion-effect) | Список строк | Снять с игрока эффект зелья |
| [openBook](#open-book) | Object | Создать и открыть игроку книгу |
| [setProperty](#set-item-property) | Object | Задать новые или перезаписать существующие свойства предмета меню |
| [remProperty](#remove-item-property) | Список объектов | Удалить указанные свойства у предмета меню |
| [refreshItem](#refresh-item) | Multiple | Обновить только один предмет меню без обновления всего меню |
| [setSkin](#set-skin) | Object | Поставить скин. |
| [resetSkin](#set-skin) | Boolean | Сбросить скин. |
| [addRecipe](#add-recipe) | Список объектов | Добавить новые кастомные рецепты крафта |
| [setButton](#set-menu-button) | Список объектов | Добавить новую кнопку в открытое меню |
| [removeButton](#remove-menu-button) | Slot (число, диапазон, матрица) | Удалить кнопку из открытого меню (см. [drag-and-drop](/docs/ru/advanced/drag-and-drop/)) |
| placeItem | Список объектов | Для drag-and-drop. Положить перетаскиваемый предмет в перетаскиваемый слот (см. [drag-and-drop](/docs/ru/advanced/drag-and-drop/)) |
| removePlaced | Slot или Object | Удалить перетаскиваемый предмет из меню (см. [drag-and-drop](/docs/ru/advanced/drag-and-drop/)) |
| **Глобальные переменные** |  |  |
| [setVar](#global-vars) | Список объектов, Список строк | Создать или заменить глобальную переменную |
| [removeVar](#global-vars) | Список объектов, Список строк | Удалить глобальную переменную |
| [incVar](#global-vars) | Список объектов, Список строк | Прибавить к глобальной числовой переменной |
| [decVar](#global-vars) | Список объектов, Список строк | Вычесть из глобальной числовой переменной |
| [mulVar](#global-vars) | Список объектов, Список строк | Умножить глобальную числовую переменную |
| [divVar](#global-vars) | Список объектов, Список строк | Разделить глобальную числовую переменную |
| **Персональные переменные** |  |  |
| [setVarp](#personal-vars) | Список объектов, Список строк | Создать или заменить персональную переменную |
| [removeVarp](#personal-vars) | Список объектов, Список строк | Удалить персональную переменную |
| [incVarp](#personal-vars) | Список объектов, Список строк | Прибавить к персональной числовой переменной |
| [decVarp](#personal-vars) | Список объектов, Список строк | Вычесть из персональной числовой переменной |
| [mulVarp](#personal-vars) | Список объектов, Список строк | Умножить персональную числовую переменную |
| [divVarp](#personal-vars) | Список объектов, Список строк | Разделить персональную числовую переменную |
| **Специальные действия** |  |  |
| [delay](#delay) | Object | Обернуть блок действий, чтобы выполнить их с задержкой |
| [bulk](#bulk) | Список объектов | Выполнить несколько действий, в том числе одного типа |
| [randActions](#random-actions) | Список объектов | Выполнить случайный блок действий из списка |
| [playerScope](#player-scope-actions) | Object | Выполнить действия для другого игрока |
| **Для генерируемых меню** |  |  |
| pagePrev | Number | Переключить на одну из предыдущих страниц. Работает только с генерируемыми меню |
| pageNext | Number | Переключить на одну из следующих страниц. Работает только с генерируемыми меню |

## Provider selection

Действия с деньгами, уровнями, правами и скинами идут через систему провайдеров AbstractMenus. Из коробки за деньги и права отвечает [Vault](https://www.spigotmc.org/resources/vault.34315/), за группы - [LuckPerms](https://www.spigotmc.org/resources/28140/), за уровни - ванильный XP, за скины - [SkinsRestorer](https://www.spigotmc.org/resources/2124/).

Если у вас экономика не на Vault, а на чём-то ещё (например, PlayerPoints), есть два варианта: поставить готовый аддон-мост вроде [PlayerPointsAddon](https://github.com/AbstractMenus/PlayerPointsAddon), либо написать [свой аддон](/docs/ru/developers/addons/), который зарегистрирует нужный плагин как провайдера. Получите вторую (или третью) экономику на том же сервере, между которыми меню переключаются по полю `provider:`.

### Как работает `auto`

В одной категории может быть зарегистрировано несколько провайдеров одновременно. Например, в секции экономики живут Vault (встроенный) и PlayerPoints (через аддон). Каждый провайдер при регистрации указывает свой id и приоритет (число): встроенные провайдеры идут с приоритетом 50, аддонные обычно с 100.

В `config.conf providers.<секция>` по умолчанию стоит `"auto"`. Это значит: AbstractMenus сам выбирает провайдера с самым высоким приоритетом среди зарегистрированных в этой секции. На сервере, где стоят и Vault, и PlayerPointsAddon, при `economy = "auto"` AbstractMenus возьмёт PlayerPoints (приоритет 100 побеждает 50).

Если хочется зафиксировать конкретный плагин, вместо `"auto"` пишется его id - `"vault"`, `"playerpoints"` или любой другой зарегистрированный. Тогда даже если придёт аддон с более высоким приоритетом, AbstractMenus продолжит ходить туда, куда сказал оператор.

Эту настройку можно переопределить ещё и для отдельного действия (`provider: "..."` внутри действия) - см. примеры ниже.

### Провайдер по умолчанию (без поля `provider:`)

```hocon
takeMoney: 100
```

Идёт через `config.conf providers.economy`. Если стоит `"auto"` (по умолчанию), плагин возьмёт провайдера с наивысшим приоритетом. Поставь конкретный id вроде `"vault"` или `"playerpoints"`, чтобы зафиксировать выбор.

### Переопределение в самом действии

Объектная форма позволяет явно назвать провайдера. Удобно, когда в одном меню смешаны валюты - монеты для покупки предметов, очки для лотереи:

```hocon
actions {
  click: [
    { type: takeMoney, amount: 100, provider: "vault"        }   // экономика сервера
    { type: giveMoney, amount: 5,   provider: "playerpoints" }   // донат-токены
  ]
}
```

### Глобальное значение для сервера

Если все меню должны использовать PlayerPoints, отредактируй `plugins/AbstractMenus/config.conf`:

```hocon
providers {
  economy = "playerpoints"
}
```

Теперь скалярная форма (`takeMoney: 100`) автоматически идёт через PlayerPoints.

### Порядок резолва

Когда AbstractMenus запускает действие с деньгами/уровнями/правами, хендлер выбирается так:

1. **`provider: "..."` в самом действии** - если указан, выигрывает всегда.
2. **`config.conf providers.<section>`** - применяется, если стоит не `auto`.
3. **По приоритету** - побеждает провайдер с наивысшим приоритетом. У встроенных он 50, у аддонов обычно 100 - значит аддон выигрывает, пока в конфиге явно не указан Vault.

Тот же формат работает для `giveLevel`/`takeLevel` (уровни), `givePermission`/`removePermission`/`addGroup`/`removeGroup` (права) и `setSkin`/`resetSkin` (скины). Просто меняй `economy` на нужную секцию в `config.conf`.

Как написать своего провайдера, см. [Хендлеры провайдеров](/docs/ru/developers/handlers/).

## Message

Отправить игроку текст. Например:

```hocon
message {
    chat: [
        "Строка 1",
        "Строка 2"
    ]
    title: "Заголовок"
    subtitle: "Подзаголовок"
    fadeIn: 10
    stay: 20
    fadeOut: 10
    actionbar: "&aПривет"
    json: "{'text'='Привет'}"
}
```

У блока много параметров, и каждый можно использовать сам по себе.

| Название             | Тип данных   | Описание                                             |
|----------------------|--------------|------------------------------------------------------|
| chat                 | Список строк | Отправить личное сообщение в чат                     |
| actionbar            | String       | Отправить текст в action bar игрока                  |
| json                 | String       | Отправить личное JSON-сообщение в чат. Работает на MC 1.9+ |
| **Параметры title**  |              |                                                      |
| title                | String       | Отправить title                                      |
| subtitle             | String       | Отправить subtitle                                   |
| fadeIn               | Number       | Время появления в тиках                              |
| stay                 | Number       | Время отображения в тиках                            |
| fadeOut              | Number       | Время исчезновения в тиках                           |

`message` можно задать и просто строкой - тогда действие пошлёт сообщение в чат.

```hocon
message: "Одиночное сообщение"
```

JSON-сообщение можно задать не строкой, а прямо HOCON-синтаксисом. Пример:

```hocon
message {
   json {
     text: "&aКакой-то текст"
     hoverEvent {
       action: "show_text"
       value: "&eКакой-то текст"
     }
   }
}
```

Этот блок эквивалентен такому JSON-сообщению:

```hocon
message {
   json: "{'text':'&aКакой-то текст', 'hoverEvent':{'action':'show_text', 'value':'&eКакой-то текст'}}"
}
```

:::tip
Подробнее о JSON-тексте [здесь](https://minecraft.gamepedia.com/Commands#Raw_JSON_text)
:::

## Command

Выполнить команду от лица игрока или от сервера. Пример:

```hocon
command {
    player: [
        "command 1",
        "command 2"
    ]
    console: [
        "command 1",
        "command 2"
    ]
}
```

Здесь `/command 1` и `/command 2` выполнятся и от игрока, и от сервера.

Можно отправить только от игрока или только от сервера:

```hocon
command { player: "command 1" }
```

То же самое с блоком `console`.

По умолчанию во всех командах плейсхолдеры подставляются перед отправкой. Поставь `ignorePlaceholder: true`, чтобы отправить строку как есть - удобно, когда в команде буквально нужны символы `%`.

```hocon
command {
  console: "lp user %player_name% permission set foo.bar true"
  ignorePlaceholder: false  // по умолчанию; подставляет %player_name%
}
```

## Chat Input

Закрывает меню и просит игрока написать что-нибудь в чат. Введённый текст плагин сохранит в переменную.

Подробнее - на странице [Chat input](/docs/ru/advanced/input/#chat-input).

## Teleport

Телепортирует игрока в указанную точку. Пример:

```hocon
teleport {
    world: "world"
    x: 0.0
    y: 100.0
    z: 0.0
    yaw: 0.0
    pitch: 0.0
}
```

У действия есть короткая версия:

```hocon
teleport: "world, 0.0, 100.0, 0.0, 0.0, 0.0"
```

## Add item

Выдаёт игроку один или несколько предметов. Формат предмета - на странице [формат предмета](/docs/ru/general/item-format/). Пример:

```hocon
itemAdd: [
    {
        slot: 0
        material: STONE
        name: "Мой камень"
    },
    {
        material: CAKE
        name: "Мой кекс"
    }
]
```

Предметы без `slot` лягут в первый свободный слот инвентаря.

:::tip
Не забывай про [сокращение для одного элемента](/docs/ru/start/hocon/) в HOCON: список из одного элемента можно записать как обычное значение.
:::

## Remove item

Зеркало `itemAdd`: предметы удаляются. Если задан `slot` - удаляется именно из него. Без `slot` - по совпадению с указанными свойствами. Пример:

```hocon
itemRemove: [
    {
        slot: 0
        material: STONE
        name: "Мой камень"
    },
    {
        material: CAKE
        name: "Мой кекс"
    }
]
```

## Sound

Проигрывает звук. Все параметры:

```hocon
sound {
    name: "SOUND_NAME"
    volume: 1.0
    pitch: 1.0
    public: false
    location {
        world: "world"
        x: 0.0
        y: 0.0
        z: 0.0
    }
}
```

Обязательный только `name`, остальные - опциональные.

- **`name`** - имя звука из Bukkit. Все имена - [здесь](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/Sound.html).

- **`volume`** - громкость, от `0.0` до `1.0`.

- **`pitch`** - pitch, от `0.0` до `10.0`.

- **`public`** - будут ли звук слышать игроки рядом.

- **`location`** - где проиграть звук. Формат локации - как в [teleport](#teleport).

Есть и короткий формат:

```hocon
sound: "SOUND_NAME"
```

Тогда звук проиграет только самому игроку, в его текущей локации.

## Custom sound

То же, что [sound](#sound), только имя звука берётся из ресурспака. Пример:

```hocon
customSound: "name.songs_sound"
```

В объектной форме принимает всё то же, что `sound`, плюс `category`:

```hocon
customSound: {
  name: "name.songs_sound"
  category: RECORDS
  volume: 1.0
  pitch: 1.0
  public: false
  location {
    world: "world"
    x: 0.0
    y: 0.0
    z: 0.0
  }
}
```

- **`name`** - имя звука из ресурспака (например, `name.songs_sound`). Обязательно.
- **`category`** - одно из значений из [этого списка](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/SoundCategory.html). По умолчанию `MASTER`.
- **`volume`** - громкость. По умолчанию `1.0`.
- **`pitch`** - pitch. По умолчанию `1.0`.
- **`public`** - если `true`, звук слышат и игроки рядом. По умолчанию `false`.
- **`location`** - где проиграть звук. Формат - как в [teleport](#teleport). По умолчанию - текущая локация игрока.

## Add potion effect

Накладывает на игрока эффект зелья.

```hocon
potionEffect: [
    {
        effectType: FAST_DIGGING
        duration: 100
        amplifier: 1
    }
]
```

Формат такой же, как у [свойства предмета `potionData`](/docs/ru/general/item-format/).

## Remove potion effect

Снимает с игрока эффекты зелий. Пример:

```hocon
removePotionEffect: [
    FAST_DIGGING,
    SPEED
]
```

Снимет с игрока сразу два эффекта.

## Open book

Открывает игроку книгу. Формат повторяет [свойство предмета `bookData`](/docs/ru/general/item-format/).

```hocon
openBook {
  author: "Питер Пайпер"
  title: "&e&lСупер заголовок"
  pages: [
    "Содержимое первой страницы",
    "Содержимое второй страницы",
    "..."
  ]
}
```

## LP meta

Действия для чтения и записи `meta`-значений пользователя в LuckPerms. Идут через активный провайдер прав и срабатывают, только когда этот провайдер - LuckPerms. Если нет, плагин пишет warning и пропускает действие.

### `lpMetaSet`

```hocon
lpMetaSet {
  ignorePlaceholder: false
  metaList: [
    { key: "prefix", value: "&7[Участник]" }
    { key: "suffix", value: "&8[%player_world%]" }
  ]
}
```

- **`metaList`** - список пар `{ key, value }`. `value` проходит через подстановку плейсхолдеров, если `ignorePlaceholder` не `true`.
- **`ignorePlaceholder`** - если `true`, `value` отправляется как есть. По умолчанию `false`.

### `lpMetaRemove`

Удаляет meta-ключи. Принимает строку или список:

```hocon
lpMetaRemove: "prefix"
```

```hocon
lpMetaRemove: [ "prefix", "suffix" ]
```

## Variables

Эта группа действий создаёт, обновляет, удаляет переменные и считает арифметику над ними.

:::note
Подробнее про переменные - на странице [Переменные](/docs/ru/general/variables/).
:::

У каждого действия с переменными две версии - **глобальная** и **персональная**. Например, `setVar` для глобальных и `setVarp` для персональных.

### Global vars

Действия для глобальных переменных.

#### Set

Создаёт или обновляет глобальную переменную. Один из форматов:

```hocon
setVar: "<var_name>::<value>"
setVar: "<var_name>::<value>::<time>"
setVar: "<var_name>::<value>::<replace>"
setVar: "<var_name>::<value>::<time>::<replace>"
```

Где:

`<var_name>`  
имя переменной

`<value>`  
значение - строка или число

`<time>`  
опционально, время жизни переменной

`<replace>`  
опционально. Если `false` и переменная уже есть, новое значение не запишется. По умолчанию `true`

Простой пример:

```hocon
setVar: "my_var::Какие-то данные"
```

Создаст глобальную переменную `my_var` со строковым значением `Какие-то данные`.

<a id="temporal-variable"></a>

#### Временная переменная

Можно сделать переменную с временем жизни - по истечении срока она удалится сама. Время жизни задаётся параметром `time`. Пример:

```hocon
setVar: "my_var::Какие-то данные::10m"
```

Здесь у `my_var` время жизни - 10 минут. Указывать его можно в секундах (`s`), минутах (`m`), часах (`h`) и днях (`d`), форматы можно комбинировать. Например:

1d 12h  
1 день (24 часа) и 12 часов

2h 30m  
2 часа и 30 минут

10s 10h  
10 часов и 10 секунд

#### Защита от перезаписи

Чтобы переменную нельзя было затереть, используй последний аргумент `<replace>`:

```hocon
setVar: "my_var::Какие-то данные::false"
```

`false` здесь - это `<replace>`, а не `<time>`. Если третий аргумент - boolean и аргументов ровно три, плагин считает его `<replace>`. И учти: это не спасает от перезаписи другим действием, у которого `replace: true`.

#### Remove

Удаляет глобальную переменную. Пример:

```hocon
removeVar: "my_var_name"
```

У действия один аргумент - имя глобальной переменной.

#### Math actions

Действия для арифметики над переменными:

- **`incVar`** - прибавить

- **`decVar`** - вычесть

- **`mulVar`** - умножить

- **`divVar`** - разделить

Если переменной с таким именем нет, плагин создаст её с указанным значением.

Пример с `incVar`:

```hocon
incVar: "my_var::2"
```

Увеличит `my_var` на 2.

У остальных арифметических действий формат такой же. Примеры:

```hocon
decVar: "my_var::10"

mulVar: "my_var::3"

divVar: "my_var::2"
```

#### Полный формат

У всех действий с переменными есть полный объектный формат. Например, у `setVar`:

| Параметр | Тип | Описание | Обязателен |
|----|----|----|----|
| name | String | Уникальное имя переменной | true |
| value | String | Значение переменной | true |
| time | String | Время жизни переменной | false |
| replace | Boolean | Если `false` и переменная уже есть, новое значение не запишется. По умолчанию `true` | false |
| player | String | Создать персональную переменную конкретному игроку. Устаревшее поле - используй отдельные действия для персональных переменных | false |

Пример:

```hocon
setVar {
  name: "myvar"
  value: "Привет, мир"
}
```

У остальных действий (`removeVar`, арифметические) формат такой же.

Объектная форма остаётся ради обратной совместимости и удобства, когда в значение нужно положить большую сложную строку.

### Personal vars

Действия для персональных переменных.

#### Set

`setVarp` создаёт персональную переменную для того, кто открыл меню. Формат такой же, как у глобального [setVar](#set).

Пример:

```hocon
setVarp: "myvar::Привет, мир"
```

#### Временная переменная

То же, что в [Временная переменная](#временная-переменная) для глобальных, только через `setVarp`.

#### Защита от перезаписи

То же, что в [Защита от перезаписи](#защита-от-перезаписи) для глобальных, только через `setVarp`.

#### Remove

Чтобы удалить персональную переменную, бери `removeVarp`. Формат такой же, как у глобальных:

```hocon
removeVarp: "my_var_name"
```

#### Math actions (personal)

Арифметика над персональными переменными:

- **`incVarp`** - прибавить

- **`decVarp`** - вычесть

- **`mulVarp`** - умножить

- **`divVarp`** - разделить

Аргументы и использование - как у [Math actions](#math-actions) для глобальных.

```hocon
incVarp: "myvar::2"
```

### Работа с несколькими переменными

Если нужно создать, удалить или поменять сразу несколько переменных, любое такое действие можно оформить списком. Пример:

**Пример 1**. Создать несколько глобальных переменных.

```hocon
setVar: [
  "variable_1::Значение переменной 1",
  "variable_3::Значение переменной 2",
  "variable_3::Значение переменной 3"
]
```

**Пример 2**. Удалить несколько глобальных переменных.

```hocon
removeVar: [
  "variable_1",
  "variable_3",
  "variable_3"
]
```

**Пример 3**. Прибавить к нескольким персональным переменным.

```hocon
incVarp: [
  "var_1::2",
  "var_3::5",
  "var_3::8"
]
```

## Delay

Обёртка над другими действиями. Два параметра:

- **`delay`** - задержка в тиках перед запуском `actions`.

- **`actions`** - обычный блок действий. Всё внутри выполнится через `delay` тиков.

Пример для блока `click`:

```hocon
click {
  message: "Привет!"
  delay {
    delay: 20
    actions {
      itemAdd {
        material: CAKE
        name: "&bТвой кекс"
      }
    }
  }
  closeMenu: true
}
```

Порядок выполнения:

1.  Отправляется сообщение "&aПривет!".
2.  Меню закрывается.
3.  Через 20 тиков игроку в инвентарь падает кекс.

## Bulk

Обёртка, которая запускает несколько групп действий по очереди. Удобна, когда нужно несколько действий с одинаковым именем подряд.

```hocon
bulk: [
  {
    message: "Привет!"
    sound: ENTITY_VILLAGER_NO
  },
  {
    sound: ENTITY_VILLAGER_YES
  },
  {
    sound: BLOCK_NOTE_BLOCK_PLING
  }
]
```

Каждый элемент списка - отдельная группа действий, как обычный блок `actions`. Разбиение на группы и даёт повторять одно и то же действие несколько раз.

## Random actions

Обёртка, которая запускает один случайный блок из списка. Когда дело доходит до `randActions`, плагин выбирает один блок наугад. Пример:

```hocon
randActions: [
  {
    message: "Действие 1"
  },
  {
    message: "Действие 2"
  },
  {
    message: "Действие 3"
  }
]
```

При нескольких срабатываниях игрок будет видеть разные сообщения.

## Player scope actions

Если действия нужно выполнить от имени другого игрока, бери обёртку `playerScope`. Пример:

```hocon
playerScope {
  name: "%player_name_placeholder%"
  actions {
    message: "Привет, %player_name_placeholder%"
  }
}
```

Сообщение внутри `actions` отправится игроку, которого нашли по имени из `name`.

`actions` тут - обычный блок действий, но все действия и правила в нём относятся к найденному игроку. Пример с дополнительными правилами:

```hocon
playerScope {
  name: "%player_name_placeholder%"
  actions {
    rules {
      gamemode: SURVIVAL
    }
    actions {
      message: "Привет, %player_name_placeholder%"
    }
  }
}
```

Блок `rules` тут тоже проверяется на найденного игрока, а не на том, кто открыл меню.

:::note
Если игрок не найден, действие просто не выполнится. Никакой ошибки не будет.
:::

## Set skin

Для работы со скинами AbstractMenus использует [SkinsRestorer](https://www.spigotmc.org/resources/2124/).

Чтобы поставить игроку скин, нужны его **texture** и **signature**. Их можно получить, например, через загрузку картинки на [MineSkin](https://mineskin.org). Скопируй значения "Texture Data" и "Texture Signature" в соответствующие поля `setSkin`.

```hocon
setSkin {
  texture: "ewogICJ0aW1lc3RhbXAiIDogMTU4ODQxODUwNjMzOSwKICAicHJvZmlsZUlkIiA6ICJiMGQ0YjI4YmMxZDc0ODg5YWYwZTg2NjFjZWU5NmFhYiIsCiAgInByb2ZpbGVOYW1lIiA6ICJNaW5lU2tpbl9vcmciLAogICJzaWduYXR1cmVSZXF1aXJlZCIgOiB0cnVlLAogICJ0ZXh0dXJlcyIgOiB7CiAgICAiU0tJTiIgOiB7CiAgICAgICJ1cmwiIDogImh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvMmQxNWQxNmE5OTU3NmRiZGE5NWIxMjA3ZmU1NGQ0MjE0Njg4MGMzNzkwNTMwOWViOTg4ODIxMDRhYzcwZjFkNSIKICAgIH0KICB9Cn0="
  signature: "dHlo+kNagxVCC5CscZrQB5iyQvCBSvG+onsB+cl2qSChe+mILMLWdLi8+stVYo7+X4mjJ9n6F7REW0ndf4fYR72x8xOdOhqgwwtFaA7dyb+NI5AtTQNoch0Tz91FqKWznTWVHBaRQB/eiBpjQz6X1H/dJDAvuN5O6gVLvHcBoBNnQ/ZLVYGrVoK3vOykbEW9NECVCu62bsroVZ0mRMaK35wVP6Wh7srkXGOoyiWuX/gqFf1W/Gpum2SsBx06166Itbu1DNs99ST+Uqx3Vv2THA+CKEpYG7tXPZZ1JSw7Pgk6KzIKyQKmIgL3SphEbzNT6XcUQlpsdzp8q3LECeWLqqk1rQwNqWmduUdsbIiRT4YSwNLyFeClE3NcPGxrPgWXCSfg+u5kHt4+n+u3s469R6DdTGXmtz+Tx06iUzwAgBAd4iNN/rDTranVZ9JokOgrNOQc/uUV4HFxYbrDAh4/LnFP4m/V7HSp5VGZye/Z1yzHtECKZFhId4iTQacckD9HT6vzvT7kH7aM7pkOzG12WkVPYBJBObgXoBUTYlAbCj18DUerT7Fx3m0vi0ThWU/fYmj8XqUFOgmzUFXeq165I0wQhpAv3JiCA0+tVCpndzD6J4MQloBRFHS1gJmI9XYGlK8G24FP8GLljW5RLfHDc672UVzdwI3m4vuFeraLjl4="
}
```

:::caution
Перед этим действием обязательно вызывай `closeMenu`: при смене скина игрок респавнится, и если меню открыто - клиент может крашнуться.
:::

## Add recipe

Выдаёт игроку рецепт. Принимает [список объектов](/docs/ru/start/hocon/), один объект на рецепт.

```hocon
addRecipe: [
  {
    key: "my_recipe"
    shape: [
      " A ",
      "ABA",
      " A "
    ]
    ingredients {
      A: STONE
      B: GRASS
    }
    result {
      material: EMERALD
      name: "Super emerald"
    }
  }
]
```

Обязательные параметры:

- **`key`** - уникальный id (имя) рецепта.

- **`shape`** - сетка верстака. Показывает, как разложить предметы.

- **`ingredients`** - ингредиенты в формате `<key>: <material>`. `A` и `B` - буквы из `shape`. Поддерживаются только материалы.

- **`result`** - предмет, который игрок получит на выходе.

Итого, чтобы скрафтить нужный предмет, надо разложить ингредиенты по ячейкам как на картинке.

![Workbench content](/docs/img/actions_recipe.png)

## Set item property

Добавляет или меняет свойство у предмета меню. Пример:

```hocon
items: [
  {
    slot: 0
    material: STONE
    name: "Тест свойств"
    click {
      setProperty {
        glow: true
      }
    }
  }
]
```

После клика предмет начнёт светиться.

:::caution
Не используй это действие в правилах отображения. На момент проверки правил предмет ещё не создан, и поменять его нельзя. Для этого случая есть [биндинги](/docs/ru/general/menu-structure/#binding-button-properties-to-rules).
:::

Через это действие можно менять и свойства других предметов в открытом меню - для этого укажи слот, в котором они лежат. Пример:

```hocon
items: [
  {
    slot: 0
    material: STONE
    name: "Кнопка 1"
    click {
      setProperty {
        slot: 1 // Слот другой кнопки
        glow: true
        lore: "Ты кликнул по Кнопке 1"
      }
    }
  },
  {
    slot: 1
    material: STONE
    name: "Кнопка 2"
  }
]
```

## Remove item property

Удаляет у предмета меню перечисленные свойства - просто перечисли их имена списком. Как и `setProperty`, действует только на конкретную сессию меню у игрока, в исходные данные не лезет.

```hocon
items: [
  {
    slot: 0
    material: STONE
    name: "Кнопка 1"
    glow: true
    click {
      remProperty: [
        "glow",
        "name"
      ]
    }
  },
]
```

После клика у предмета останется только `material`. Удалённые свойства вернутся, если меню переоткрыть.

Можно удалять свойства и у другого предмета в открытом меню - для этого `remProperty` оформляется как объект с двумя полями: `slot` и список `properties`.

```hocon
items: [
  {
    slot: 0
    material: STONE
    name: "Кнопка 1"
    click {
      remProperty {
        slot: 1
        properties: [
          "glow",
          "lore"
        ]
      }
    }
  },
  {
    slot: 1
    material: STONE
    name: "Кнопка 2"
    glow: true
    lore: [
      "Это кнопка 2"
    ]
  }
]
```

Теперь клик по **Кнопке 1** убирает `glow` и `lore` у **Кнопки 2**.

## Refresh item

Обновить один конкретный предмет, а не всё меню. Это сильно экономит ресурсы: вместо перерисовки всех предметов плагин трогает только один.

У действия три режима.

### Режим 1. Обновить текущий

Обновляет тот предмет, на котором висит действие. Пример:

```hocon
items: [
  {
    slot: 0
    material: STONE
    name: "Опыт: %player_xp%"
    click {
      giveXp: 100
      refreshItem: true
    }
  },
]
```

### Режим 2. Обновить с задержкой

Обновляет текущий предмет через указанное число тиков.

```hocon
items: [
  {
    slot: 0
    material: STONE
    name: "Опыт: %player_xp%"
    click {
      giveXp: 100
      refreshItem: 20 // Тики вместо 'true'
    }
  }
]
```

### Режим 3. Обновить другой предмет

Обновляет предмет в указанном слоте. Можно задать задержку.

```hocon
items: [
  {
    slot: 0
    material: STONE
    name: "Кнопка"
    click {
      giveXp: 100
      refreshItem {
        slot: 1
        delay: 20 // Опционально
      }
    }
  },
  {
    slot: 1
    material: STONE
    name: "Опыт: %player_xp%"
  },
]
```

## Set menu button

Добавляет в меню интерактивный предмет. Пример:

```hocon
setButton {
  slot: 4
  material: CAKE
  name: "Новая кнопка"
  click {
    message: "&aПривет!"
  }
}
```

После выполнения кнопка появится в слоте 4. Если в слоте уже что-то было - заменится.

:::note
Добавленная кнопка пропадёт при переоткрытии или обновлении меню. Действие живёт только в текущей сессии.
:::

## Remove menu button

Убирает кнопку из открытого меню. Принимает слот в любом из доступных форматов. Пример:

```hocon
removeButton: 4
```

Удалит предмет в слоте 4, если он там есть. Можно задавать слот и другими форматами:

```hocon
removeButton: "0-8"
```

Удалит предметы из слотов `0, 1, 2, ..., 8`.

:::note
Удалённая кнопка вернётся при переоткрытии или обновлении меню. Действие живёт только в текущей сессии.
:::
