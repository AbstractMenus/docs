---
title: Формат предмета
description: "Предмет описывается не только в кнопках меню. Тот же [объект](/docs/ru/start/hocon/) живёт в правилах, действиях и активаторах - формат у него везде одинаковый."
---

<div class="audience-tags"><span class="audience-tag audience-author">Автор меню</span></div>

Предмет описывается не только в кнопках меню. Тот же [объект](/docs/ru/start/hocon/) живёт в правилах, действиях и активаторах - формат у него везде одинаковый.

:::tip[Ищешь полный список свойств?]
В [Шпаргалке](/docs/ru/general/cheatsheet/) все свойства собраны в одном месте, удобно гонять Ctrl-F. На этой странице - полный справочник с примерами по каждому свойству.
:::

## Свойства по категориям

### Слот и кулдаун

| Имя | Тип данных | Пример | Описание |
|----|----|----|----|
| slot | Multiple | См. [Слот](#slot) ниже | Где лежит предмет. Используется только в предметах меню и в некоторых действиях / правилах. |
| clickCooldown | Number | `clickCooldown: 500` | Кулдаун клика по предмету в **миллисекундах**. Сбрасывается при закрытии или обновлении меню. Если значение меньше глобального [click debounce floor](/docs/ru/start/config/), сработает глобальный порог - чтобы обойти его полностью, поставь `clickCooldown: 0`. |

### Material installers

Чтобы задать материал, ставится ровно одно из этих свойств. Всё остальное (отображение, механики) накладывается поверх.

| Имя | Тип данных | Пример | Описание |
|----|----|----|----|
| material | String | `material: "DIAMOND_SWORD"` | Материал предмета по имени. |
| texture | String | См. [Текстура](#texture) | Кастомная текстура головы по id, url или base64. Каталог голов: <https://minecraft-heads.com>. |
| skullOwner | String | См. [Skull Owner](#skull-owner) | Натянуть скин игрока на голову. |
| hdb | String | `hdb: "2853"` | Голова из [HeadDatabase](https://www.spigotmc.org/resources/14280/) по id. |
| mmoitem | String | `mmoitem: "WEAPON:MY_SWORD"` | Предмет из [MMOItems](https://www.spigotmc.org/resources/39267/) по типу и id. |
| itemsAdder | String | `itemsAdder: "<namespaced id>"` | Кастомный стак из реестра [ItemsAdder](https://www.spigotmc.org/resources/73355/). |
| oraxen | String | `oraxen: "my_sword"` | Кастомный стак из [Oraxen](https://www.spigotmc.org/resources/72448/). |
| equipItem | String или Object | См. [Экипированный предмет](#equipped-item) | Взять предмет из слота инвентаря игрока. |
| serialized | String | См. [Serialized](#deserialize-from-base64-string) | Восстановить предмет из base64-строки. |

### Отображение

| Имя | Тип данных | Пример | Описание |
|----|----|----|----|
| name | String | `name: "Peter Piper"` | Отображаемое имя. Принимает коды `&`, `<#RRGGBB>` и (если `useMiniMessage: true`) теги MiniMessage. |
| lore | Список строк | См. [Лор](#lore) | Строки лора под именем. Цвета и MiniMessage - как в `name`. |
| nameLight | String | `nameLight: "&aHi"` | Legacy-вариант `name`: только коды `&`, MiniMessage не парсится. Подходит, если в имени есть символы `<`. |
| loreLight | Список строк | Как у `lore` | Legacy-вариант `lore`: только коды `&`. |
| glow | Boolean | `glow: true` | Свечение (через невидимое зачарование). |
| flags | Список строк | См. [Флаг](#flag) | Флаги предмета. |
| color | String | - | Цвет брони или зелья. |
| model | Number | `model: 1234567` | Custom model data. |

### Механики

| Имя | Тип данных | Пример | Описание |
|----|----|----|----|
| count | Number | `count: 64` | Размер стака. |
| damage | Number | `damage: 100` | Урон (полоса под предметом) для предметов с прочностью. Больше = меньше прочности. |
| data | Number | `data: 3` | Legacy data-байт / значение прочности. На современном Bukkit эквивалентно `damage`; пригодится при переносе пре-1.13 конфигов. |
| unbreakable | Boolean | `unbreakable: true` | Делает предмет неразрушаемым. |
| enchantments | Object | См. [Зачарования](#enchantments) | Зачарования предмета. |
| enchantStore | Object | Как у `enchantments` | Положить зачарование в `ENCHANTED_BOOK`, чтобы потом перенести через наковальню. |
| attributeModifier | Список объектов | См. [Модификатор атрибута](#attribute-modifier) | Модификаторы атрибутов (урон, броня, скорость и т.д.). |
| potionData | Список объектов | См. [Эффект зелья](#potion-effect) | Эффекты зелья, если предмет - зелье. |
| fireworkData | Object | См. [Фейерверк](#firework) | Эффекты взрыва на `FIREWORK_ROCKET`. |
| bookData | Object | См. [Книга](#book) | Автор, заголовок и страницы книги. |
| bannerData | Object | См. [Баннер](#banner) | Цвета и узоры баннера. |
| shieldData | Object | Как у `bannerData` | Цвета и узоры щита (формат баннера). |
| recipes | Список объектов | - | Кастомные рецепты на `KNOWLEDGE_BOOK`. |
| nbt | Object | См. [NBT-теги](#nbt-tags) | Сырые NBT-теги. |

### Условные

| Имя | Тип данных | Пример | Описание |
|----|----|----|----|
| bindings | Список объектов | См. [Биндинги](/docs/ru/general/menu-structure/#binding-button-properties-to-rules) | Подменить свойства, если правила прошли. Классика - показывать красным стеклом, когда у игрока не хватает денег. |

<a id="slot"></a>

## Слот

Слот - это ячейка в инвентаре (меню или игрока), куда положить предмет. Задать его можно несколькими способами.

### Способ 1. Координаты X, Y

```hocon
slot: "4,3" // x,y
```

`x` и `y` - горизонтальная и вертикальная позиции, отсчёт с 1. Ниже картинка для наглядности.

![Как работают XY-слоты](/docs/img/items_slots_xy.png)

### Способ 2. Индекс

```hocon
slot: 0
```

Слот можно задать прямым индексом. Шпаргалка с номерами:

![Индексы слотов](/docs/img/items_slots_id.png)

### Способ 3. Диапазон

```hocon
slot: "0-6"
```

Чтобы положить один предмет сразу в несколько слотов, бери диапазон. Предмет окажется в ячейках с индексами 0, 1, ..., 6. Удобно, когда нужно залить меню фоновым предметом и не хочется руками расставлять его по каждому слоту.

### Способ 4. Матрица

```hocon
items: [
  {
    slot: [
      "xxxxxxxxx",
      "x-------x",
      "x-------x",
      "x-------x",
      "x-------x",
      "xxxxxxxxx"
    ]
    material: BLACK_STAINED_GLASS_PANE
  }
]
```

Для более сложной расстановки задавай слот матрицей ячеек. Например, нужна рамка - подойдёт пример выше. На выходе получится так:

![Результат использования матрицы ячеек](/docs/img/items_slots_matrix_1.png)

Каждый символ матрицы - один слот.

`-` всегда означает пустой слот. `x` - слоты, в которые ляжет текущий предмет. Вместо `x` подойдёт любой символ, кроме `-`.

Матрица может быть размером с меню или меньше - то есть слот можно задавать так же, как и размер самого меню:

```hocon
slot: [
  "xxx",
  "x-x",
  "xxx"
]
```

Меню получится такое:

![Результат использования матрицы меньшего размера](/docs/img/items_slots_matrix_2.png)

:::note
Отсчёт в матрице всегда идёт от верхнего левого угла.
:::

:::caution
Предметы, разложенные диапазоном или матрицей, не клонируются. Если у одного из них поменять свойство, оно поменяется и у всех остальных, разложенных тем же слотом. Для уникальных предметов такой формат не подходит.
:::

## Skull Owner

Свойство, чтобы получить голову игрока по нику. Принимает имя игрока. Например:

```hocon
skullOwner: "Notch"
```

Если нужна голова того, кто открыл меню, бери имя из плейсхолдера:

```hocon
skullOwner: "%player_name%"
```

:::caution
AbstractMenus подгружает скин игрока, когда тот заходит на сервер. Если в `skullOwner` указан игрок, который ещё не заходил, плагин попробует подтянуть скин на лету при открытии меню. Для статичных имён надёжнее использовать `texture`.
:::

:::note
Если скин не удалось загрузить (например, у игрока его нет), на голове окажется дефолтный Steve или Alex.
:::

<a id="texture"></a>

## Текстура

Текстуру можно указать одним из форматов ниже.

### URL текстуры

Прямая ссылка на изображение текстуры. Пример:

```hocon
texture: "https://textures.minecraft.net/texture/a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787"
```

### Хэш текстуры

SHA-1 хэш изображения скина. Это хвост URL текстуры без префикса `https://textures.minecraft.net/texture/`. Пример:

```hocon
texture: "a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787"
```

Префикс плагин подставит сам, и финальный URL получится `https://textures.minecraft.net/texture/a45d68aea87cc3fd20b96b21e18255db298b2eac986526473116bd3b5750b787`.

### Закодированная Base64

Так называемый "Texture value" - URL текстуры, упакованный в JSON и закодированный в Base64. Указывается с префиксом `base64:`. Пример:

```hocon
texture: "base64:eyJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvYTQ1ZDY4YWVhODdjYzNmZDIwYjk2YjIxZTE4MjU1ZGIyOThiMmVhYzk4NjUyNjQ3MzExNmJkM2I1NzUwYjc4NyJ9fX0="
```

<a id="equipped-item"></a>

## Экипированный предмет

Берёт предмет из инвентаря игрока. По умолчанию - из инвентаря того, кто открыл меню. Пример:

```hocon
equipItem: HEAD
```

:::tip
Все типы слотов смотри [здесь](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/inventory/EquipmentSlot.html)
:::

Можно взять предмет и у другого игрока - оформи свойство как объект и укажи имя. Плейсхолдеры тут работают. Пример:

```hocon
equipItem {
  player: "%player_name_placeholder%"
  slot: HEAD
}
```

<a id="deserialize-from-base64-string"></a>

## Десериализация из base64-строки

`serialized` восстанавливает предмет из base64-строки. Чаще всего такая строка приходит из плейсхолдера экстрактора [`item_serialized`](/docs/ru/general/placeholders/#item-extractor) - например, в drag-and-drop сценариях. Пример:

```hocon
{
  slot: 0
  serialized: "%moved_item_serialized%" // Плейсхолдер возвращает base64-строку
  name: "Новое имя предмета"
  lore: "Новый лор предмета"
}
```

Если рядом указать другие свойства предмета (например, `name`), они перезапишут соответствующие свойства десериализованного предмета.

:::note
Если сохранить такую строку в переменную и попытаться использовать после апгрейда или отката версии сервера, предмет может не подняться - формат бывает несовместим.
:::

<a id="lore"></a>

## Лор

Лор - это [список строк](/docs/ru/start/hocon/). Каждый элемент - одна строка лора. Например:

```hocon
lore: [
  "Строка 1",
  "Строка 2",
  "Строка 3"
]
```

<a id="enchantments"></a>

## Зачарования

Зачарования имеют формат `<enchantment>: <level>`, где:

`<enchantment>`  
Имя зачарования из Bukkit. Список [здесь](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/enchantments/Enchantment.html).

`<level>`  
Уровень зачарования. Минимальный уровень - `1`.

Пример:

```hocon
enchantments {
  DAMAGE_ALL: 1
  DURABILITY: 2
}
```

## Цвет

Используется для покраски предметов, у которых это поддерживается (кожаная броня, зелья). Задать цвет можно тремя способами - на примере белого:

### Способ 1. RGB

Значения RGB (0-255) через запятую.

```hocon
color: "255,255,255" // r,g,b
```

### Способ 2. Имя цвета Spigot

Стандартные имена цветов Spigot.

```hocon
color: WHITE
```

:::note[См. также]
Список цветов есть [здесь](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/Color.html)
:::

### Способ 3. HEX

Шестнадцатеричный формат, как в CSS.

```hocon
color: "#FFFFFF"
```

:::note
Цвета применяются только к кожаной броне, зельям и другим предметам, которые это поддерживают.
:::

<a id="flag"></a>

## Флаг

Флаги управляют отображением свойств предмета. Это [список строк](/docs/ru/start/hocon/), как `lore`. Например:

```hocon
flags: [
  "HIDE_UNBREAKABLE",
  "HIDE_ENCHANTS",
]
```

Или если флаг один:

```hocon
flags: "HIDE_ATTRIBUTES"
```

В Spigot сейчас доступны такие флаги:

- **`HIDE_ATTRIBUTES`** - скрыть атрибуты предмета (например, урон).

- **`HIDE_DESTROYS`** - скрыть инфу о прочности.

- **`HIDE_ENCHANTS`** - скрыть зачарования.

- **`HIDE_PLACED_ON`** - скрыть инфу о том, куда предмет можно ставить.

- **`HIDE_POTION_EFFECTS`** - скрыть эффекты зелий.

- **`HIDE_UNBREAKABLE`** - скрыть метку `unbreakable`.

:::note
Набор флагов в разных версиях Spigot отличается. Сверяйся с актуальным списком на [этой](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/inventory/ItemFlag.html) или похожих страницах. Список выше - ориентир, не источник истины.
:::

<a id="potion-effect"></a>

## Эффект зелья

Свойство - [список объектов](/docs/ru/start/hocon/), один объект на эффект. Пример:

```hocon
potionData: [
  {
    effectType: FAST_DIGGING
    duration: 100
    amplifier: 1
  },
  {
    effectType: SPEED
    duration: 100
    amplifier: 2
  }
]
```

У каждого эффекта три обязательных параметра:

- **`effectType`** - тип эффекта. Все типы - [здесь](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/potion/PotionEffectType.html).

- **`duration`** - длительность в тиках (1 секунда = 20 тиков).

- **`amplifier`** - уровень эффекта.

:::note
`potionData` работает только если это поддерживает сам материал предмета.
:::

<a id="firework"></a>

## Фейерверк

Цветной фейерверк собирается через `fireworkData`. Пример:

```hocon
fireworkData {
  power: 2
  effects: [
    {
      type: BALL
      trail: false
      colors: [
        "#FFFFFF",
        "#FF0000"
      ]
      fadeColors: [
        "#000000",
        "#00FF00"
      ]
    }
  ]
}
```

`power` задаёт время жизни фейерверка. Опциональный, по умолчанию `1`.

`effects` - [список объектов](/docs/ru/start/hocon/), один объект на эффект:

- **`type`** - форма взрыва. Все типы - [здесь](https://hub.spigotmc.org/javadocs/bukkit/org/bukkit/FireworkEffect.Type.html).

- **`trail`** - есть ли след в полёте.

- **`colors`** - цвета в момент взрыва.

- **`fadeColors`** - цвета при затухании.

В `fireworkData` можно положить несколько эффектов - тогда фейерверк взорвётся всеми сразу.

:::note
Свойство работает только если материал - `FIREWORK_ROCKET`.
:::

<a id="book"></a>

## Книга

Через это свойство собирается уже написанная книга со страницами. Пример:

```hocon
bookData {
  author: "Питер Пайпер"
  title: "&e&lЗаголовок"
  pages: [
    "Содержимое первой страницы",
    "Содержимое второй страницы"
  ]
}
```

Параметры:

- **`author`** - отображаемый автор.

- **`title`** - отображаемый заголовок.

- **`pages`** - [список строк](/docs/ru/start/hocon/). Каждый элемент - отдельная страница.

:::note
`bookData` работает только для материала `WRITTEN_BOOK`.
:::

<a id="banner"></a>

## Баннер

Декорированный баннер задаётся через `bannerData`. Есть два способа.

### Способ 1. NBT

Можно собрать баннер в любом дизайнере, например [этом](https://www.planetminecraft.com/banner/), и вставить готовый NBT строкой. Пример:

```hocon
bannerData: "{BlockEntityTag: {Base: 12, Patterns: [{Pattern: hh, Color: 6}, {Pattern: vh, Color: 6}, {Pattern: lud, Color: 7}, {Pattern: tts, Color : 6}, {Pattern: vh, Color: 14}, {Pattern: cre, Color: 2}]}}"
```

### Способ 2. HOCON

Многословнее, но нагляднее - перечислить узоры [списком объектов](/docs/ru/start/hocon/). Пример:

```hocon
bannerData: [
  {
    type: BASE
    color: WHITE
  },
  {
    type: MOJANG
    color: RED
  }
]
```

Каждый элемент - один узор:

- **`type`** - тип узора. Все типы - [здесь](https://hub.spigotmc.org/javadocs/spigot/org/bukkit/block/banner/PatternType.html).

- **`color`** - цвет узора. Spigot принимает для баннеров только именованные цвета.

<a id="attribute-modifier"></a>

## Модификатор атрибута

Накладывает на предмет записи Bukkit `AttributeModifier`. Удобно, когда нужен кастомный урон / броня / скорость без возни с сырым NBT.

```hocon
attributeModifier: [
  {
    type: "generic.attack_damage"
    amount: 7
    operation: "add_number"
    slot: HAND
  },
  {
    type: "generic.armor"
    amount: 5
    operation: "add_number"
    slot: CHEST
  }
]
```

Параметры:

- **`type`** - ключ атрибута. Bukkit ждёт namespaced-форму, например `generic.attack_damage`, `generic.armor`, `generic.movement_speed`. Внутри плагин приводит её к нижнему регистру.
- **`amount`** - числовое значение модификатора. По умолчанию `0`.
- **`operation`** - одно из `add_number`, `add_scalar`, `multiply_scalar_1`. По умолчанию `add_number`.
- **`slot`** - опционально. Ограничить модификатор одним слотом экипировки: `HAND`, `OFF_HAND`, `HEAD`, `CHEST`, `LEGS`, `FEET`. Без этого поля модификатор работает в любом слоте.

<a id="nbt-tags"></a>

## NBT-теги

:::caution
Чтобы пользоваться этим свойством, сначала поставь плагин [NBT_API](https://spigotmc.org/resources/7939).
:::
Через NBT можно навешивать на предмет всё, чего ещё нет в самом плагине. Сами теги пишутся прямо в HOCON или строкой. Например, можно задать имя предмета через NBT:

```hocon
{
  slot: 0
  material: IRON_PICKAXE
  nbt {
    display {
      Name: "&aМоя кирка"
    }
  }
}
```

:::caution
Внутри NBT-тегов плейсхолдеры не работают - так сделано ради производительности, чтобы не пропускать каждое строковое значение через подстановку на лету.
:::

Внутри `nbt` пиши любые HOCON-конструкции - при загрузке плагин превратит их в NBT-теги. Учти, что в разных версиях Minecraft NBT отличается. Если тег не работает - скорее всего, формат неверный для твоей версии. Ещё пример: навесим на предмет два зачарования:

```hocon
{
  slot: 0
  material: IRON_PICKAXE
  nbt {
    display {
      Name: "Моя кирка"
    }
    ench: [
      {
        id: 34
        lvl: 2
      },
      {
        id: 35
        lvl: 3
      }
    ]
  }
}
```

`ench` - [список объектов](/docs/ru/start/hocon/). Типы и имена тегов должны точно совпадать с тем, что Minecraft ждёт в финальном NBT.

И, разумеется, можно класть свои кастомные теги:

```hocon
nbt {
  mytag1: "mytag"
  mytag2: 15
  mytag3 {
    mytag1: "hello"
  }
}
```

Эти теги повиснут на предмете. Посмотреть их можно отдельными плагинами или модами.
