---
title: Форматирование текста
description: "Как и большинство плагинов, AM меняет `&` на нативный префикс цвета Minecraft - `§`. Раскрашивать можно любой текст. Несколько примеров ниже."
---

<div class="audience-tags"><span class="audience-tag audience-author">Автор меню</span></div>

## Коды цветов

Как и большинство плагинов, AM меняет `&` на нативный префикс цвета Minecraft - `§`. Раскрашивать можно любой текст. Несколько примеров ниже.

```hocon
message: "&aSome &etext"
```

Шпаргалка с кодами цветов:

![Стандартные коды цветов](/docs/img/colors.png)

## RGB-цвета

Текст можно красить и через RGB hex-коды в скобках `<>`:

```hocon
message: "<#00FF00>Какой-то текст"
```

Текст окрасится в зелёный.

RGB-цвета сочетаются с обычными кодами. Пример:

```hocon
message: "<#00FF00>Какой-то &eтекст"
```

## Формат MiniMessage

:::caution
По умолчанию выключен. Включается в `config.conf` через `useMiniMessage: true`. Флаг нужен потому, что парсинг MiniMessage - это дополнительный проход по каждой строке при рендере, и серверам, которым MiniMessage не нужен, нет смысла за него платить.
:::

[MiniMessage](https://docs.adventure.kyori.net/minimessage/format.html) - формат на тегах: `<red>`, `<rainbow>...</rainbow>`, `<gradient:#FF0000:#0000FF>`, `<click:run_command:/foo>`, `<hover:show_text:'tooltip'>` и т.д.

AbstractMenus поддерживает MiniMessage в сообщениях, в `name` / `lore` предметов и в книгах. У предметов рендерятся только визуальные теги (цвета, градиенты, декорации); интерактивные `<click>` и `<hover>` срабатывают только в чат-сообщениях.

MiniMessage в действии `message`:

```hocon
message: "<hover:show_text:'<red>тест'>ТЕСТ"
```

MiniMessage в имени и лоре предмета:

```hocon
{
   slot: 0
   material: cake
   name: "<rainbow>Super Cake!</rainbow>"
   lore: [
      "",
      "<yellow>Eat <blue>me!"
   ]
}
```

![MiniMessage в предмете](/docs/img/minimessage_item.png)

*Результат*
