# 📝 Как добавить партнера без кода

## Быстрая инструкция:

### Шаг 1: Открыть файл
```
miniapp/partners.json
```

### Шаг 2: Скопировать шаблон
```json
{
  "id": "partner4",
  "name": "Название компании",
  "description": "Краткое описание услуг",
  "logo": "🚀",
  "url": "https://example.com",
  "category": "services",
  "featured": false
}
```

### Шаг 3: Заполнить данные
- `id` - уникальный идентификатор (partner4, partner5...)
- `name` - название компании
- `description` - описание (1-2 строки)
- `logo` - emoji иконка (🎓 🛠️ 🎨 🚀 💼 📱 ⚡ 🌟)
- `url` - ссылка на сайт
- `category` - категория:
  - `education` - образование
  - `support` - поддержка
  - `services` - сервисы
- `featured` - показывать TOP бейдж:
  - `true` - показать
  - `false` - не показывать

### Шаг 4: Вставить в файл
Открыть `miniapp/partners.json` и добавить после последнего партнера:

```json
{
  "partners": [
    {
      "id": "partner1",
      "name": "AI Academy",
      ...
    },
    {
      "id": "partner2",
      "name": "Tech Support",
      ...
    },
    {
      "id": "partner3",
      "name": "Design Studio",
      ...
    },
    {
      "id": "partner4",
      "name": "ВАША КОМПАНИЯ",
      "description": "Ваше описание",
      "logo": "🚀",
      "url": "https://your-site.com",
      "category": "services",
      "featured": true
    }
  ]
}
```

⚠️ Не забудьте запятую после предыдущего партнера!

### Шаг 5: Сохранить и задеплоить
```bash
git add miniapp/partners.json
git commit -m "Add new partner: НАЗВАНИЕ"
git push origin main
```

### Шаг 6: Проверить
1. Дождаться деплоя Vercel (1-2 минуты)
2. Открыть Mini App
3. Перейти на вкладку "🤝 Партнеры"
4. Увидеть нового партнера!

---

## 🎨 Примеры emoji для logo:

### Образование:
🎓 📚 📖 🧠 💡 ✏️ 📝

### Поддержка:
🛠️ 🔧 ⚙️ 🆘 💬 📞 🎧

### Сервисы:
🚀 ⚡ 🌟 💼 📱 🎨 🎯

### Бизнес:
💰 📈 💳 🏢 🤝 💎 🏆

---

## ✅ Готовые примеры:

### Пример 1: Образовательная платформа
```json
{
  "id": "partner4",
  "name": "Skillbox",
  "description": "Онлайн-университет",
  "logo": "🎓",
  "url": "https://skillbox.ru",
  "category": "education",
  "featured": true
}
```

### Пример 2: Техподдержка
```json
{
  "id": "partner5",
  "name": "24/7 Support",
  "description": "Круглосуточная поддержка",
  "logo": "🆘",
  "url": "https://support.com",
  "category": "support",
  "featured": false
}
```

### Пример 3: Дизайн студия
```json
{
  "id": "partner6",
  "name": "Creative Studio",
  "description": "Дизайн и брендинг",
  "logo": "🎨",
  "url": "https://creative.com",
  "category": "services",
  "featured": true
}
```

---

## 🚫 Частые ошибки:

### Ошибка 1: Забыли запятую
```json
// ❌ НЕПРАВИЛЬНО
{
  "id": "partner3",
  "name": "Design Studio"
}
{
  "id": "partner4",
  "name": "New Partner"
}

// ✅ ПРАВИЛЬНО
{
  "id": "partner3",
  "name": "Design Studio"
},
{
  "id": "partner4",
  "name": "New Partner"
}
```

### Ошибка 2: Неуникальный ID
```json
// ❌ НЕПРАВИЛЬНО - два partner3
{
  "id": "partner3",
  "name": "First"
},
{
  "id": "partner3",
  "name": "Second"
}

// ✅ ПРАВИЛЬНО
{
  "id": "partner3",
  "name": "First"
},
{
  "id": "partner4",
  "name": "Second"
}
```

### Ошибка 3: Неправильная категория
```json
// ❌ НЕПРАВИЛЬНО
"category": "tech"

// ✅ ПРАВИЛЬНО (только эти 3)
"category": "education"
"category": "support"
"category": "services"
```

---

## 💡 Советы:

1. Используйте короткие описания (до 50 символов)
2. Выбирайте яркие emoji
3. Проверяйте ссылки перед добавлением
4. Featured партнеры показываются первыми
5. Можно добавлять неограниченное количество

---

## 🎉 Готово!

Теперь вы можете добавлять партнеров без изменения кода!
