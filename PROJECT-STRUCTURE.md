# Felix Bot - Оптимизированная структура проекта

## 📁 Новая структура

```
felix-bot/
├── api/                          # Vercel Serverless Functions
│   ├── webhook.js               # Main webhook handler
│   ├── history.js               # Get conversation history
│   ├── stats.js                 # Get user statistics
│   ├── clear.js                 # Clear user history
│   └── export.js                # Export data (NEW)
│
├── src/                          # Source code (organized)
│   ├── handlers/                # Request handlers
│   │   ├── messageHandler.js   # Text messages
│   │   ├── voiceHandler.js     # Voice messages
│   │   ├── commandHandler.js   # Bot commands
│   │   └── callbackHandler.js  # Inline buttons
│   │
│   ├── services/                # Business logic
│   │   ├── aiService.js        # AI operations
│   │   ├── dbService.js        # Database operations
│   │   ├── telegramService.js  # Telegram API
│   │   └── cacheService.js     # Redis cache (NEW)
│   │
│   ├── middleware/              # Middleware functions
│   │   ├── auth.js             # Telegram auth verification
│   │   ├── rateLimit.js        # Rate limiting
│   │   ├── errorHandler.js     # Error handling
│   │   └── logger.js           # Logging
│   │
│   ├── utils/                   # Utility functions
│   │   ├── validators.js       # Input validation
│   │   ├── formatters.js       # Data formatting
│   │   └── constants.js        # Constants
│   │
│   └── config/                  # Configuration
│       ├── database.js         # DB config
│       ├── telegram.js         # Telegram config
│       └── ai.js               # AI config
│
├── miniapp/                      # Telegram Mini App
│   ├── index.html              # Main page
│   ├── css/
│   │   └── styles.css          # Styles (extracted)
│   ├── js/
│   │   ├── app.js              # Main app logic
│   │   ├── api.js              # API client
│   │   └── ui.js               # UI components
│   └── assets/
│       └── icons/              # Icons and images
│
├── database/                     # Database schemas
│   ├── migrations/             # Migration files
│   │   ├── 001_initial.sql
│   │   ├── 002_add_indexes.sql
│   │   └── 003_add_triggers.sql
│   ├── seeds/                  # Seed data
│   │   └── initial_data.sql
│   └── schema.sql              # Full schema
│
├── tests/                        # Tests
│   ├── unit/                   # Unit tests
│   │   ├── services/
│   │   └── utils/
│   ├── integration/            # Integration tests
│   │   └── api/
│   └── e2e/                    # End-to-end tests
│       └── bot/
│
├── docs/                         # Documentation
│   ├── API.md                  # API documentation
│   ├── ARCHITECTURE.md         # Architecture overview
│   ├── DEPLOYMENT.md           # Deployment guide
│   └── CONTRIBUTING.md         # Contributing guide
│
├── scripts/                      # Utility scripts
│   ├── deploy.sh               # Deployment script
│   ├── migrate.js              # Database migration
│   └── seed.js                 # Seed database
│
├── .github/                      # GitHub configuration
│   └── workflows/
│       ├── ci.yml              # CI pipeline
│       ├── deploy.yml          # Deployment
│       └── test.yml            # Tests
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── package.json                  # Dependencies
├── vercel.json                   # Vercel configuration
├── jest.config.js                # Jest configuration
├── README.md                     # Project README
└── LICENSE                       # License file
```

## 🎯 Преимущества новой структуры

### 1. Разделение ответственности
- Каждый модуль отвечает за одну задачу
- Легко найти нужный код
- Проще тестировать

### 2. Масштабируемость
- Легко добавлять новые функции
- Модульная архитектура
- Независимые компоненты

### 3. Поддерживаемость
- Понятная структура
- Документация рядом с кодом
- Легко онбордить новых разработчиков

### 4. Тестируемость
- Отдельная папка для тестов
- Легко мокать зависимости
- CI/CD интеграция

## 📦 Модули

### Handlers (обработчики)
Отвечают за обработку входящих запросов:
- `messageHandler` - текстовые сообщения
- `voiceHandler` - голосовые сообщения
- `commandHandler` - команды бота
- `callbackHandler` - нажатия на кнопки

### Services (сервисы)
Бизнес-логика приложения:
- `aiService` - работа с AI (Groq)
- `dbService` - работа с БД
- `telegramService` - Telegram API
- `cacheService` - кеширование (Redis)

### Middleware (промежуточное ПО)
Обработка запросов до основной логики:
- `auth` - проверка подлинности
- `rateLimit` - ограничение запросов
- `errorHandler` - обработка ошибок
- `logger` - логирование

### Utils (утилиты)
Вспомогательные функции:
- `validators` - валидация данных
- `formatters` - форматирование
- `constants` - константы

## 🔄 Миграция

### Этап 1: Создать новую структуру
1. Создать папки `src/`, `tests/`, `docs/`
2. Переместить код в соответствующие модули
3. Обновить импорты

### Этап 2: Рефакторинг
1. Разбить `webhook.js` на handlers
2. Извлечь бизнес-логику в services
3. Добавить middleware

### Этап 3: Добавить тесты
1. Unit тесты для services
2. Integration тесты для API
3. E2E тесты для бота

### Этап 4: Документация
1. API документация
2. Архитектурная документация
3. Deployment guide

## 🚀 Следующие шаги

1. Создать новую структуру папок
2. Переместить существующий код
3. Добавить недостающие модули
4. Написать тесты
5. Обновить документацию
