---
title: Шпаргалка
description: Все действия, правила, активаторы, свойства предметов и каталоги на одной странице с поиском по Ctrl-F.
---

<div class="audience-tags"><span class="audience-tag audience-author">Автор меню</span></div>

Справочник на одну страницу. Имена, краткие описания и ссылка на полную документацию по каждому пункту. Удобно искать через Ctrl-F.

## Активаторы - что открывает меню

| Название | Что делает | Подробнее |
|---|---|---|
| `command` | `/menu` или любая другая кастомная команда | [docs](/docs/ru/general/activators/#активатор-command) |
| `chat` | Игрок пишет в чат точную фразу | [docs](/docs/ru/general/activators/#активатор-chat) |
| `containsChat` | Сообщение игрока в чате содержит подстроку | [docs](/docs/ru/general/activators/#активатор-chat) |
| `join` | Игрок зашёл на сервер | [docs](/docs/ru/general/activators/) |
| `regionJoin` | Игрок вошёл в регион WorldGuard | [docs](/docs/ru/general/activators/#регионы-worldguard) |
| `regionLeave` | Игрок вышел из региона WorldGuard | [docs](/docs/ru/general/activators/#регионы-worldguard) |
| `clickItem` | ПКМ по предмету в руке | [docs](/docs/ru/general/activators/#активатор-clickitem) |
| `clickNPC` | ПКМ по NPC из Citizens | [docs](/docs/ru/general/activators/#активатор-clicknpc) |
| `clickEntity` | ПКМ по сущности | [docs](/docs/ru/general/activators/#активатор-clickentity) |
| `shiftClickEntity` | Shift + ПКМ по сущности | [docs](/docs/ru/general/activators/#активатор-shiftclickentity) |
| `clickBlock` | Клик по блоку в конкретной локации | [docs](/docs/ru/general/activators/) |
| `clickBlockType` | Клик по любому блоку заданного типа | [docs](/docs/ru/general/activators/) |
| `button` | Нажатие кнопки | [docs](/docs/ru/general/activators/#активаторы-button-lever-plate) |
| `lever` | Переключение рычага | [docs](/docs/ru/general/activators/#активаторы-button-lever-plate) |
| `plate` | Наступание на нажимную плиту | [docs](/docs/ru/general/activators/#активаторы-button-lever-plate) |
| `table` | Клик по табличке с конкретным текстом | [docs](/docs/ru/general/activators/) |
| `swapItems` | Нажатие клавиши смены руки (по умолчанию `F`) | [docs](/docs/ru/general/activators/) |

## Правила - проверяются перед открытием/показом предмета/запуском действия

| Название | Что проверяет | Подробнее |
|---|---|---|
| `permission` | У игрока есть право | [docs](/docs/ru/general/rules/) |
| `world` | Игрок в указанном мире | [docs](/docs/ru/general/rules/) |
| `gamemode` | Режим игры игрока совпадает | [docs](/docs/ru/general/rules/) |
| `group` | Игрок в группе LuckPerms | [docs](/docs/ru/general/rules/) |
| `money` | У игрока хотя бы N валюты (Vault/настроенный провайдер) | [docs](/docs/ru/general/rules/) |
| `level` | У игрока хотя бы N уровней | [docs](/docs/ru/general/rules/) |
| `xp` | У игрока хотя бы N XP | [docs](/docs/ru/general/rules/) |
| `health` | У игрока хотя бы N HP | [docs](/docs/ru/general/rules/) |
| `foodLevel` | У игрока хотя бы N еды | [docs](/docs/ru/general/rules/) |
| `chance` | Случайная проверка с шансом N процентов | [docs](/docs/ru/general/rules/) |
| `online` | На сервере хотя бы N игроков | [docs](/docs/ru/general/rules/) |
| `playerIsOnline` | Конкретный игрок онлайн | [docs](/docs/ru/general/rules/) |
| `inventoryItems` | У игрока в инвентаре есть указанные предметы | [docs](/docs/ru/general/rules/#inventory-items) |
| `heldItem` | Предмет в основной руке совпадает | [docs](/docs/ru/general/rules/#held-item) |
| `freeSlot` | В инвентаре есть свободный слот (или конкретный слот свободен) | [docs](/docs/ru/general/rules/) |
| `freeSlotCount` | В инвентаре хотя бы N свободных слотов | [docs](/docs/ru/general/rules/) |
| `existVar` | Глобальная переменная существует | [docs](/docs/ru/general/rules/#var-existing) |
| `existVarp` | Персональная переменная существует | [docs](/docs/ru/general/rules/#var-existing) |
| `placedItem` | В drag-and-drop слоте лежит ожидаемый предмет | [docs](/docs/ru/general/rules/) |
| `region` | Игрок внутри региона WorldGuard | [docs](/docs/ru/general/rules/) |
| `bungeeOnline` | На BungeeCord-сервере хотя бы N игроков | [docs](/docs/ru/general/rules/#bungeecord-online) |
| `bungeeIsOnline` | BungeeCord-сервер онлайн | [docs](/docs/ru/general/rules/) |
| `if` | Логическое сравнение плейсхолдеров/значений | [docs](/docs/ru/general/rules/#if-rule) |
| `js` | Выполнить JavaScript-выражение | [docs](/docs/ru/general/rules/#javascript) |
| `and` | Все вложенные правила выполнены | [docs](/docs/ru/advanced/logical/) |
| `or` | Хотя бы одно вложенное правило выполнено | [docs](/docs/ru/advanced/logical/) |
| `oneof` | Останавливается на первом true | [docs](/docs/ru/advanced/logical/) |
| `playerScope` | Перепроверить правила относительно другого игрока | [docs](/docs/ru/advanced/logical/) |

## Действия - что выполняется по клику/открытию/срабатыванию активатора

| Название | Что делает | Подробнее |
|---|---|---|
| `message` | Отправить игроку чат/actionbar/title/json | [docs](/docs/ru/general/actions/#message) |
| `broadcast` | Тот же формат, что и `message`, но всем онлайн | [docs](/docs/ru/general/actions/#message) |
| `miniMessage` | Отправить MiniMessage-строку (legacy - `message` уже поддерживает MiniMessage) | [docs](/docs/ru/general/actions/#message) |
| `playerChat` | Отправить сообщение в чат от лица игрока | [docs](/docs/ru/general/actions/) |
| `print` | Печать в консоль - помощник для отладки | [docs](/docs/ru/general/actions/) |
| `command` | Выполнить команды от лица игрока и/или консоли | [docs](/docs/ru/general/actions/#command) |
| `inputChat` | Захватить ввод из чата в переменную | [docs](/docs/ru/advanced/input/#chat-input) |
| `teleport` | Телепортировать игрока в локацию | [docs](/docs/ru/general/actions/#teleport) |
| `bungeeConnect` | Отправить игрока на BungeeCord-сервер | [docs](/docs/ru/general/actions/) |
| `setGamemode` | Сменить режим игры | [docs](/docs/ru/general/actions/) |
| `setHealth` | Установить здоровье | [docs](/docs/ru/general/actions/) |
| `setFoodLevel` | Установить уровень еды | [docs](/docs/ru/general/actions/) |
| `sound` | Проиграть Bukkit-звук | [docs](/docs/ru/general/actions/#sound) |
| `customSound` | Проиграть звук из ресурспака | [docs](/docs/ru/general/actions/#custom-sound) |
| `potionEffect` | Наложить эффект зелья | [docs](/docs/ru/general/actions/#add-potion-effect) |
| `removePotionEffect` | Снять эффект зелья | [docs](/docs/ru/general/actions/#remove-potion-effect) |
| `openBook` | Открыть виртуальную книгу | [docs](/docs/ru/general/actions/#open-book) |
| `addRecipe` | Добавить рецепт-знание | [docs](/docs/ru/general/actions/#add-recipe) |
| `itemAdd` | Добавить предметы в инвентарь игрока | [docs](/docs/ru/general/actions/#add-item) |
| `itemRemove` | Удалить предметы по слоту или совпадению | [docs](/docs/ru/general/actions/#remove-item) |
| `itemClear` | То же, что `itemRemove`, без учёта количества в стаке | [docs](/docs/ru/general/actions/#remove-item) |
| `inventoryClear` | Очистить инвентарь игрока | [docs](/docs/ru/general/actions/) |
| `openMenu` | Открыть другое меню | [docs](/docs/ru/general/actions/) |
| `openMenuCtx` | Открыть другое меню с передачей контекста активатора | [docs](/docs/ru/general/actions/) |
| `closeMenu` | Закрыть текущее меню | [docs](/docs/ru/general/actions/) |
| `refreshMenu` | Перерисовать всё меню | [docs](/docs/ru/general/actions/) |
| `refreshItem` | Перерисовать один предмет | [docs](/docs/ru/general/actions/#refresh-item) |
| `setProperty` | Добавить или перезаписать свойства предмета в открытом меню | [docs](/docs/ru/general/actions/#set-item-property) |
| `remProperty` | Удалить свойства у предмета в открытом меню | [docs](/docs/ru/general/actions/#remove-item-property) |
| `setButton` | Добавить или заменить кнопку в открытом меню | [docs](/docs/ru/general/actions/#set-menu-button) |
| `removeButton` | Удалить кнопку из открытого меню | [docs](/docs/ru/general/actions/#remove-menu-button) |
| `placeItem` | Drag-and-drop помощник: положить предмет в перетаскиваемый слот | [docs](/docs/ru/advanced/drag-and-drop/) |
| `removePlaced` | Удалить (или частично удалить) положенный предмет | [docs](/docs/ru/advanced/drag-and-drop/) |
| `pageNext`/`pagePrev` | Листание страниц в генерируемом меню | [docs](/docs/ru/general/actions/) |
| `delay` | Запустить вложенные действия через N тиков | [docs](/docs/ru/general/actions/#delay) |
| `bulk` | Запустить несколько групп действий в одном блоке | [docs](/docs/ru/general/actions/#bulk) |
| `randActions` | Случайно выбрать один блок | [docs](/docs/ru/general/actions/#random-actions) |
| `playerScope` | Запустить действия для другого игрока | [docs](/docs/ru/general/actions/#player-scope-actions) |
| `takeMoney`/`giveMoney` | Снятие/зачисление валюты (провайдер экономики) | [docs](/docs/ru/general/actions/#provider-selection) |
| `givePermission`/`removePermission` | Выдать/отозвать право (провайдер прав) | [docs](/docs/ru/general/actions/#provider-selection) |
| `addGroup`/`removeGroup` | Добавить/убрать группу (провайдер прав) | [docs](/docs/ru/general/actions/#provider-selection) |
| `lpMetaSet`/`lpMetaRemove` | Изменение метаданных LuckPerms (нужен LuckPerms) | [docs](/docs/ru/general/actions/) |
| `giveXp`/`takeXp` | Зачисление/списание XP (провайдер уровней) | [docs](/docs/ru/general/actions/#provider-selection) |
| `giveLevel`/`takeLevel` | Зачисление/списание уровней (провайдер уровней) | [docs](/docs/ru/general/actions/#provider-selection) |
| `setSkin`/`resetSkin` | Установить/сбросить скин (провайдер скинов) | [docs](/docs/ru/general/actions/#set-skin) |
| `setVar`/`removeVar`/`incVar`/`decVar`/`mulVar`/`divVar` | Операции с глобальными переменными | [docs](/docs/ru/general/actions/#global-vars) |
| `setVarp`/`removeVarp`/`incVarp`/`decVarp`/`mulVarp`/`divVarp` | Операции с персональными переменными | [docs](/docs/ru/general/actions/#personal-vars) |

Если действие связано с деньгами/уровнями/правами/плейсхолдерами/скинами, можно дописать `provider: "vault"` (или любой другой зарегистрированный id), чтобы зафиксировать, какой бэкенд это обработает. См. [хендлеры провайдеров](/docs/ru/developers/handlers/).

## Свойства предметов

| Группа | Свойства |
|---|---|
| Установщик материала | `material`, `texture`, `skullOwner`, `hdb`, `mmoitem`, `itemsAdder`, `oraxen`, `equipItem`, `serialized` |
| Отображение | `name`, `lore`, `nameLight`, `loreLight`, `glow`, `flags`, `color`, `model` |
| Механика | `count`, `damage`, `data`, `unbreakable`, `enchantments`, `enchantStore`, `attributeModifier`, `potionData`, `fireworkData`, `bookData`, `bannerData`, `shieldData`, `recipes`, `nbt` |
| Слот | `slot` (число, X-Y, диапазон, матрица) |
| Кулдаун | `clickCooldown` (миллисекунды) |
| Условные | `bindings` (переопределение свойств при срабатывании правил) |

Полная документация с примерами: [формат предмета](/docs/ru/general/item-format/).

`nameLight`/`loreLight` - это legacy-варианты `name`/`lore`, которые игнорируют MiniMessage и обрабатывают только цветовые коды через `&`. Полезно, когда в имени есть символы `<`, которые MiniMessage попытается разобрать.

## Каталоги - для генерируемых меню

| Название | Что выдаёт | Подробнее |
|---|---|---|
| `iterator` | Последовательность целых чисел от `start` до `end` | [docs](/docs/ru/advanced/generation/#iterator) |
| `players` | Игроков онлайн | [docs](/docs/ru/advanced/generation/#players) |
| `entities` | Сущности из мира зрителя (или указанного) | [docs](/docs/ru/advanced/generation/#entities) |
| `worlds` | Загруженные миры | [docs](/docs/ru/advanced/generation/#worlds) |
| `bungee_servers` | Серверы BungeeCord (требует `bungeecord: true`) | [docs](/docs/ru/advanced/generation/#bungeecord-servers) |
| `slice` | Разбивает строку на элементы по разделителю | [docs](/docs/ru/advanced/generation/#slice) |

## Команды - для оператора и автора меню

| Команда | Назначение | Подробнее |
|---|---|---|
| `/am open <menu> [player]` | Открыть меню | [docs](/docs/ru/general/commands/) |
| `/am reload` | Перезагрузить все файлы меню | [docs](/docs/ru/general/commands/) |
| `/am serve` | Следить и автоперезагружать (для разработки) | [docs](/docs/ru/general/commands/) |
| `/am version` | Вывести версию | [docs](/docs/ru/general/commands/) |
| `/am addons list` | Список загруженных аддонов | [docs](/docs/ru/general/commands/#am-addons) |
| `/am addons info <name>` | Метаданные аддона | [docs](/docs/ru/general/commands/#am-addons) |
| `/am addons load <name>` | Загрузить аддон | [docs](/docs/ru/general/commands/#am-addons) |
| `/am addons reload <name>` | Hot-reload аддона | [docs](/docs/ru/general/commands/#am-addons) |
| `/am addons rescan` | Подхватить новые jar в `addons/` | [docs](/docs/ru/general/commands/#am-addons) |
| Подкоманды `/var` | Управление глобальными переменными | [docs](/docs/ru/general/commands/#var) |
| Подкоманды `/varp` | Управление персональными переменными | [docs](/docs/ru/general/commands/#varp) |

Всё ограничено одним правом: **`am.admin`**.
