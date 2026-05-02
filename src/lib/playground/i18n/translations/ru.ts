import type { Dict } from './en';

/**
 * Russian translation. Partial - any missing key falls back to the English
 * canonical dict at runtime, so a community contributor shipping a half-done
 * locale never blanks the UI.
 */
export const ru: Partial<Dict> = {
  'brand.sub': 'Песочница',

  'mode.editor': 'Редактор',
  'mode.tutorial': 'Уроки',
  'mode.aria': 'Режим песочницы',

  'theme.toggle.aria': 'Переключить тему',
  'lang.select.aria': 'Язык',

  'tab.errors': 'Ошибки',
  'tab.warnings': 'Предупреждения',
  'tab.json': 'Результирующий JSON',
  'tab.tutorial': 'Урок',

  'empty.errors': 'Ошибок нет.',
  'empty.warnings':
    'Предупреждений нет. Они помечают подозрительные, но валидные конфиги (неизвестные ключи, неразрешённые подстановки) и не мешают меню загрузиться.',
  'empty.json': 'Здесь появится результирующий JSON, как только парсер заработает.',
  'empty.tutorial': 'Режим уроков появится в M.6.',
  'empty.history': 'История пока пуста.',

  'status.ready': 'готов',
  'status.ok': 'ок',
  'status.errors': '${count} ошибк${plural}',
  'status.warnings': '${count} предупреждени${plural}',
  'scope.hint.placeholder': '- ключи -',
  'scope.hint.title': 'Показать подсказки для текущей области',
  'scope.hint.body': '${scope} · ${count} ключ${plural} · ${shortcut}',

  'btn.history': 'История',
  'btn.format': 'Формат',
  'btn.format.title': 'Форматировать (Cmd+Shift+F)',
  'btn.share': 'Поделиться',
  'btn.copy': 'Копировать',
  'btn.reset': 'Сброс',
  'btn.reset.title': 'Сбросить песочницу до шаблона по умолчанию',
  'confirm.reset.editor': 'Сбросить песочницу до шаблона по умолчанию? Текущие правки будут потеряны.',
  'confirm.reset.tutorial': 'Сбросить урок до стартового состояния? Прогресс по уроку будет потерян.',
  'btn.warnings.on': 'предупреждения: вкл',
  'btn.warnings.off': 'предупреждения: выкл',
  'btn.warnings.title.on':
    'Скрыть подчёркивание предупреждений в редакторе (вкладка остаётся)',
  'btn.warnings.title.off': 'Показать подчёркивание предупреждений в редакторе',

  'toast.linkCopied': 'Ссылка скопирована',
  'toast.copyFailed': 'Не удалось скопировать',

  'json.desc':
    'Так AbstractMenus видит ваш конфиг после раскрытия подстановок, точечных ключей и наложений. Используйте, чтобы убедиться, что ${vars} разворачиваются правильно и вложенные объекты схлопываются как нужно.',

  'tutorial.goalLabel': 'Цель: ',
  'tutorial.passed': '✓ Цель достигнута',
  'tutorial.btn.hint': 'Подсказка',
  'tutorial.btn.reset': 'Сброс',
  'tutorial.btn.skip': 'Пропустить',
  'tutorial.btn.next': 'Дальше',
  'tutorial.done.title': '🎉 Курс пройден',
  'tutorial.done.body': 'Вы прошли все уроки. Теперь попробуйте режим редактора.',

  'history.empty': '(пусто)',
  'history.justNow': 'только что',
  'history.minutes': '${n} мин назад',
  'history.hours': '${n} ч назад',
  'history.days': '${n} дн назад',

  'page.title': 'HOCON Песочница - AbstractMenus',
  'page.description':
    'Браузерная песочница для HOCON-конфигов меню AbstractMenus. Валидируйте, делитесь, учитесь.',
};
