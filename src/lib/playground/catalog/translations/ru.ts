/**
 * Russian translations for catalog key descriptions.
 *
 * Keys: `<scope>.<name>` (matches what the playground uses to look up a
 * KeyDef). Missing keys fall back to the canonical English description on
 * the KeyDef, so partial translations are fine - extend incrementally.
 */
export const ru: Record<string, string> = {
  // menu-root
  'menu-root.title': 'Заголовок меню над инвентарём.',
  'menu-root.size': 'Количество рядов инвентаря (1-6).',
  'menu-root.activators': 'Как игроки открывают меню (команды, клики, регионы и т.д.).',
  'menu-root.items': 'Список items, отображаемых в меню.',
  'menu-root.denyActions': 'Действия по умолчанию когда click rules не прошли.',
  'menu-root.updateInterval': 'Как часто меню пере-рендерит динамические items (например 20t, 1s).',
  'menu-root.requirements': 'Требования при открытии (rules которые должны пройти).',
  'menu-root.pages': 'Для постраничных меню: число страниц.',
  'menu-root.menus': 'Для анимированных меню: список фрейм-определений.',
  'menu-root.metaList': 'Начальные значения player-meta при открытии.',
  'menu-root.closeActions': 'Действия при закрытии меню.',
  'menu-root.matrix': 'Layout-матрица для генерируемых меню (каждый ряд - строка slot-кодов).',
  'menu-root.defaults': 'Общий item-шаблон; переиспользуется через подстановку ${defaults}.',

  // item
  'item.slot': 'Слот в инвентаре. Один номер (0), диапазон "0-8", координаты "1,2", или матрица (объект).',
  'item.material': 'Bukkit material. Печатай "IRON" - получишь IRON_INGOT, IRON_BLOCK, ...',
  'item.name': 'Отображаемое имя предмета (поддерживает legacy-цвета через &).',
  'item.lore': 'Строки lore.',
  'item.count': 'Размер стака (1-64).',
  'item.click': 'Click-обработчик: какие кнопки запускают какие действия.',
  'item.rules': 'Rules видимости/клика для этого item.',
  'item.sound': 'Звук при взаимодействии с item.',
  'item.texture': 'Кастомная текстура головы (URL, hash или base64).',
  'item.skullOwner': 'Имя игрока, чей скин использовать для PLAYER_HEAD.',
  'item.flags': 'Список ItemFlag (HIDE_ENCHANTS, HIDE_ATTRIBUTES, ...).',
  'item.enchantments': 'Карта зачарование→уровень (например { SHARPNESS = 5 }).',
  'item.color': 'Цвет (RGB-список, имя или HEX) для кожаной брони / зелий.',
  'item.cooldown': 'Cooldown клика для этого item (например 5s).',
  'item.placedItem': 'Item в anvil/crafting слоте (для input-меню).',
  'item.updateInterval': 'Per-item интервал обновления (перекрывает menu-level).',
  'item.bindings': 'Rules-гейтированные перекрытия свойств.',
  'item.item': 'Перекрыть существующий item-шаблон по ссылке.',
  'item.effect': 'Данные потионного эффекта (для POTION/SPLASH_POTION).',
  'item.firework': 'Данные взрыва фейерверка.',

  // click
  'click.left': 'Обработчик левого клика (actions/rules/denyActions).',
  'click.right': 'Обработчик правого клика.',
  'click.middle': 'Обработчик среднего клика.',
  'click.drop': 'Обработчик drop-кнопки (Q).',
  'click.shiftLeft': 'Обработчик Shift+левый клик.',
  'click.shiftRight': 'Обработчик Shift+правый клик.',
  'click.actions': 'Действия запускаемые на этот клик (когда rules прошли).',
  'click.rules': 'Rules гейтящие действия.',
  'click.denyActions': 'Действия запускаемые когда rules не прошли.',

  // actions (most common)
  'actions.message': 'Отправить чат-сообщение игроку.',
  'actions.command': 'Запустить console- или player-команду. Строка или { cmd, as }.',
  'actions.sound': 'Воспроизвести Bukkit-звук.',
  'actions.openMenu': 'Открыть другое меню по id.',
  'actions.closeMenu': 'Закрыть текущее открытое меню.',
  'actions.refreshMenu': 'Обновить текущее меню (перерендерить динамические items).',
  'actions.itemAdd': 'Выдать item игроку.',
  'actions.itemRemove': 'Забрать item из инвентаря игрока.',
  'actions.teleport': 'Телепортировать игрока. Координаты или именованная локация.',
  'actions.giveMoney': 'Выдать Vault-валюту игроку.',
  'actions.takeMoney': 'Забрать Vault-валюту у игрока.',
  'actions.setGamemode': 'Задать gamemode (CREATIVE/SURVIVAL/...).',

  // rules
  'rules.permission': 'У игрока должен быть этот permission.',
  'rules.money': 'У игрока должен быть как минимум такой Vault-баланс.',
  'rules.levels': 'У игрока должно быть как минимум столько XP-уровней.',
  'rules.gamemode': 'Игрок должен быть в этом gamemode.',
  'rules.world': 'Игрок должен быть в этом мире.',
  'rules.region': 'WorldGuard: игрок должен быть в этом регионе.',
  'rules.cooldown': 'Per-player cooldown гейт.',

  // binding
  'binding.rules': 'Rules гейтящие этот binding (должны пройти чтобы props применились).',
  'binding.props': 'Свойства item для применения когда rules прошли (любой item-scope ключ).',

  // activators
  'activators.command': 'Открывать через /команда. Строка, список или { command, aliases }.',
  'activators.chat': 'Открывать через chat-триггер (полное слово, частичное или символ).',
};
