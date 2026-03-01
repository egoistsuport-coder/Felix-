# 🔐 Исправление доступа к GitHub

## Проблема
```
remote: Permission to egoistsuport-coder/Felix-.git denied to Mag1coon.
fatal: unable to access 'https://github.com/egoistsuport-coder/Felix-.git/': The requested URL returned error: 403
```

Пользователь `Mag1coon` не имеет прав на репозиторий `egoistsuport-coder/Felix-`.

## Решение 1: Использовать GitHub Desktop (РЕКОМЕНДУЕТСЯ)

1. Откройте GitHub Desktop
2. Убедитесь, что вы залогинены под правильным аккаунтом (`egoistsuport-coder`)
3. В GitHub Desktop нажмите "Fetch origin"
4. Вы увидите изменения в файлах:
   - `api/admin.js`
   - `miniapp/index.html`
5. Напишите commit message: "Felix v5.0: Added personalization settings"
6. Нажмите "Commit to main"
7. Нажмите "Push origin"

## Решение 2: Переключить аккаунт в Git

### Вариант A: Использовать Personal Access Token

1. Создайте Personal Access Token на GitHub:
   - Зайдите на https://github.com/settings/tokens
   - Нажмите "Generate new token (classic)"
   - Выберите scope: `repo` (полный доступ к репозиториям)
   - Скопируйте токен

2. Используйте токен для push:
```bash
git push https://YOUR_TOKEN@github.com/egoistsuport-coder/Felix-.git main
```

### Вариант B: Изменить remote URL с токеном

```bash
git remote set-url origin https://YOUR_TOKEN@github.com/egoistsuport-coder/Felix-.git
git push origin main
```

### Вариант C: Использовать SSH

1. Создайте SSH ключ (если еще нет):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Добавьте SSH ключ на GitHub:
   - Скопируйте содержимое `~/.ssh/id_ed25519.pub`
   - Зайдите на https://github.com/settings/keys
   - Нажмите "New SSH key"
   - Вставьте ключ

3. Измените remote на SSH:
```bash
git remote set-url origin git@github.com:egoistsuport-coder/Felix-.git
git push origin main
```

## Решение 3: Проверить текущего пользователя Git

```bash
git config user.name
git config user.email
```

Если нужно изменить:
```bash
git config user.name "egoistsuport-coder"
git config user.email "your_email@example.com"
```

## Текущий статус

✅ Коммит создан локально:
```
[main 1fd0fde] Felix v5.0: Added personalization settings and user settings API
 2 files changed, 439 insertions(+), 12 deletions(-)
```

❌ Push не выполнен из-за проблем с доступом

## Что изменено в коммите

- `api/admin.js` - добавлены эндпоинты getUserSettings и updateUserSettings
- `miniapp/index.html` - добавлена персонализация в настройках

## Следующий шаг

Используйте GitHub Desktop для push или настройте аутентификацию одним из способов выше.
