# Решение проблемы с Jinja2 в HTML

## Описание проблемы
VS Code подчеркивает как ошибки Jinja2 синтаксис в HTML файлах:
```html
<div class="disk-bar-used" style="{{ used_style }}">
```

## Решение

### 1. Установить расширение Better Jinja
- В VS Code: `Ctrl+Shift+X` → ищешь "Better Jinja" (автор: Samuel Colvin) → кнопка Install
- ID расширения: `samuelcolvin.jinjahtml`

**Альтернатива:** `wholroyd.jinja` (если Better Jinja не подходит)

### 2. Добавить файловые ассоциации в `.vscode/settings.json`
Открыть `.vscode/settings.json` (или создать, если его нет) и добавить:

```json
{
    "files.associations": {
        "*.html": "jinja-html",
        "*.jinja": "jinja",
        "*.jinja2": "jinja",
        "*.j2": "jinja"
    }
}
```

### 3. Перезагрузить VS Code
- `Ctrl+Shift+P` → `Reload Window`
- Или полностью закрыть и открыть окно

### 4. Проверить язык файла
- Внизу справа в строке статуса должно быть написано `Jinja-HTML` вместо `HTML`
- Если написано `HTML`, кликни на язык и выбери `Jinja-HTML` из выпадающего списка

## Если проблема остаётся
1. Удали расширение: `Ctrl+Shift+P` → `Extensions: Uninstall` → выбери Better Jinja
2. Переустанови его или попробуй `wholroyd.jinja`
3. Убедись, что `.vscode/settings.json` содержит правильные ассоциации
4. Перезагрузи VS Code полностью

## Результат
После этого:
- ✅ Jinja2 синтаксис правильно подсвечивается
- ✅ Скобки `{{ }}`, `{% %}`, `{# #}` не подчеркиваются как ошибки
- ✅ HTML синтаксис также полностью сохраняется
