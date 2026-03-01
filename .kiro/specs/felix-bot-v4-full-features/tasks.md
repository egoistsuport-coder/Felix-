# Implementation Plan: Felix Bot v4.0

## Overview

Этот план имплементации преобразует Felix Bot v3.1 в полнофункциональную версию v4.0 с PostgreSQL хранилищем, расширенными AI командами, профессиональным Mini App и системой аналитики. План фокусируется на Phase 1-2 (P0 и P1 требования) для создания надежного MVP с возможностью расширения.

Текущая архитектура v3.1 включает:
- `api/webhook.js` - основной webhook с in-memory контекстом
- `lib/ai.js` - AI сервис с Groq API
- `lib/db.js` - базовый database wrapper
- `miniapp/index.html` - простой Mini App интерфейс

Версия v4.0 добавляет persistent storage, расширенные команды, профессиональный Mini App с историей и аналитикой.

## Tasks

- [x] 1. Настройка инфраструктуры базы данных
  - Создать Supabase проект для production
  - Применить полную database schema из design.md
  - Настроить indexes для оптимизации запросов
  - Настроить connection pooling (20 connections)
  - Создать Supabase Storage buckets (voices, images, documents, exports)
  - Настроить storage policies для retention (90/30/30/7 дней)
  - Добавить environment variables в Vercel (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY)
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.5_


- [-] 2. Обновление Database Service (lib/db.js)
  - [x] 2.1 Реализовать getOrCreateUser() для управления пользователями
    - Создать или получить user из таблицы users
    - Сохранять username, first_name, last_name, language
    - Возвращать полный User объект
    - _Requirements: 1.1_

  - [ ]* 2.2 Написать property test для getOrCreateUser
    - **Property 3: User Data Isolation**
    - **Validates: Requirements 1.5**

  - [x] 2.3 Реализовать saveMessage() для сохранения сообщений
    - Сохранять user_id, role, content, message_type, metadata
    - Возвращать Message объект с id и created_at
    - Использовать транзакции для атомарности
    - _Requirements: 1.1, 1.2, 1.3, 1.7_

  - [ ]* 2.4 Написать property test для saveMessage
    - **Property 1: Database Round-Trip Preservation**
    - **Validates: Requirements 1.8**

  - [ ] 2.5 Реализовать getHistory() для получения истории
    - Поддерживать параметры: limit, offset, type, fromDate, toDate
    - Возвращать messages в хронологическом порядке
    - Включать metadata и tags для каждого сообщения
    - Реализовать пагинацию с has_more флагом
    - _Requirements: 1.4, 1.5_

  - [ ]* 2.6 Написать property test для getHistory
    - **Property 2: Message Chronological Ordering**
    - **Validates: Requirements 1.4**

  - [ ] 2.7 Реализовать getUserStats() для статистики
    - Подсчитывать сообщения по типам (text, voice, image, document)
    - Подсчитывать использование по командам
    - Вычислять total_tokens и avg_response_time
    - Группировать по часам и дням
    - Поддерживать фильтрацию по периоду (day, week, month, all)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 2.8 Написать property test для getUserStats
    - **Property 10: Analytics Sum Invariant**
    - **Validates: Requirements 3.8**

  - [ ] 2.9 Реализовать saveTags() и getTagsForUser()
    - Сохранять связь message_id с tag_id
    - Поддерживать флаг is_auto_generated
    - Возвращать теги с частотой использования
    - _Requirements: 8.4, 8.7_

  - [ ]* 2.10 Написать property test для tags
    - **Property 22: Tag-Message Relationship Persistence**
    - **Validates: Requirements 8.4**

  - [ ] 2.11 Реализовать getUserSettings() и updateUserSettings()
    - Получать и обновлять ai_temperature, ai_model, theme, notifications_enabled
    - Валидировать temperature в диапазоне 0.0-2.0
    - Возвращать обновленные settings
    - _Requirements: 11.5, 11.6_

  - [ ]* 2.12 Написать property test для settings
    - **Property 26: Settings Persistence Round-Trip**
    - **Validates: Requirements 11.5**

- [ ] 3. Checkpoint - Проверка Database Service
  - Убедиться что все unit и property тесты проходят
  - Проверить что database schema применена корректно
  - Спросить пользователя если возникли вопросы


- [ ] 4. Создание Voice Service (lib/voice.js)
  - [ ] 4.1 Реализовать downloadVoiceFile() для загрузки аудио
    - Получать file_path через Telegram Bot API getFile
    - Скачивать audio buffer через HTTPS
    - Валидировать размер файла (< 20MB)
    - Обрабатывать ошибки загрузки с retry (3 попытки)
    - _Requirements: 2.1, 2.7_

  - [ ]* 4.2 Написать unit test для downloadVoiceFile
    - Тестировать успешную загрузку
    - Тестировать превышение лимита размера
    - Тестировать retry логику

  - [ ] 4.3 Реализовать transcribe() для транскрипции
    - Использовать Groq Whisper Large v3 API
    - Поддерживать автоопределение языка
    - Возвращать { text, duration, language }
    - Обрабатывать ошибки транскрипции
    - _Requirements: 2.2, 2.3_

  - [ ]* 4.4 Написать unit test для transcribe
    - Тестировать транскрипцию на русском
    - Тестировать транскрипцию на английском
    - Тестировать обработку ошибок

  - [ ] 4.5 Реализовать saveVoiceMessage() для сохранения
    - Загружать audio file в Supabase Storage (bucket: voices)
    - Сохранять metadata в таблицу voice_messages
    - Сохранять основное сообщение через db.saveMessage()
    - Связывать voice_message с message через message_id
    - Возвращать { fileUrl, messageId }
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 4.6 Написать property test для saveVoiceMessage
    - **Property 7: Voice File Storage Persistence**
    - **Validates: Requirements 2.1, 2.5**

- [ ] 5. Создание Storage Service (lib/storage.js)
  - [ ] 5.1 Реализовать uploadFile() для загрузки файлов
    - Поддерживать buckets: voices, images, documents, exports
    - Генерировать уникальные имена файлов: {user_id}/{message_id}_{timestamp}.{ext}
    - Возвращать public URL файла
    - Обрабатывать ошибки загрузки с retry
    - _Requirements: 2.1, 2.5_

  - [ ] 5.2 Реализовать getFileUrl() для получения URL
    - Генерировать signed URL с expiration
    - Поддерживать разные buckets
    - _Requirements: 2.5_

  - [ ] 5.3 Реализовать deleteFile() для удаления файлов
    - Удалять файлы по истечении retention периода
    - Логировать операции удаления
    - _Requirements: 2.5, 2.6_

  - [ ]* 5.4 Написать unit tests для Storage Service
    - Тестировать upload/download/delete операции
    - Тестировать генерацию уникальных имен
    - Тестировать обработку ошибок


- [ ] 6. Обновление AI Service (lib/ai.js)
  - [ ] 6.1 Расширить getChatResponse() для работы с database
    - Загружать историю через db.getHistory() вместо in-memory
    - Применять user settings (temperature, model)
    - Сохранять metadata (tokens, model, latency)
    - Возвращать { content, tokens, model, latency }
    - _Requirements: 1.2, 1.3, 11.6_

  - [ ]* 6.2 Написать property test для getChatResponse
    - **Property 27: Settings Application to AI Requests**
    - **Validates: Requirements 11.6**

  - [ ] 6.3 Реализовать createSummary() для саммаризации
    - Принимать параметры: messages, detailLevel (brief|medium|detailed)
    - Использовать LLaMA 3.3 70B модель
    - Генерировать структурированное summary с ключевыми темами
    - Валидировать минимум 5 сообщений
    - Завершать в течение 30 секунд (timeout)
    - Возвращать { summary, tokens }
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

  - [ ]* 6.4 Написать property test для createSummary
    - **Property 16: Summary Compression**
    - **Validates: Requirements 5.8**

  - [ ] 6.5 Реализовать analyzeText() для анализа текста
    - Принимать параметры: text, analysisType (sentiment|keywords|topics|readability|all)
    - Определять тональность с confidence score
    - Извлекать ключевые слова и темы
    - Вычислять readability score
    - Автоопределять язык текста
    - Валидировать минимум 10 слов
    - Завершать в течение 15 секунд
    - Возвращать { sentiment, keywords, topics, readability, language }
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 6.6 Написать property test для analyzeText
    - **Property 18: Analysis Output Completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

  - [ ] 6.7 Реализовать generateContent() для генерации контента
    - Принимать параметры: prompt, contentType (article|email|social|code|ideas), options { length, tone }
    - Применять соответствующие шаблоны для каждого типа
    - Поддерживать tone: formal, informal, professional, creative
    - Поддерживать length: short, medium, long
    - Завершать в течение 45 секунд
    - Обрабатывать превышение лимита токенов
    - Возвращать { content, tokens }
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.7, 7.8_

  - [ ]* 6.8 Написать property test для generateContent
    - **Property 19: Content Generation Parameter Application**
    - **Validates: Requirements 7.2, 7.3, 7.5**

  - [ ] 6.9 Реализовать generateTags() для генерации тегов
    - Анализировать содержимое сообщения
    - Генерировать 1-5 семантических тегов
    - Возвращать теги с confidence scores
    - Фильтровать теги с confidence < 0.6
    - _Requirements: 8.1, 8.2, 8.3, 8.8_

  - [ ]* 6.10 Написать property test для generateTags
    - **Property 20: Tag Count Constraint**
    - **Validates: Requirements 8.2**

- [ ] 7. Checkpoint - Проверка AI Service
  - Убедиться что все AI функции работают корректно
  - Проверить что timeouts соблюдаются
  - Спросить пользователя если возникли вопросы


- [ ] 8. Создание Tag Service (lib/tag.js)
  - [ ] 8.1 Реализовать generateTags() wrapper
    - Вызывать ai.generateTags() для AI-генерации
    - Нормализовать теги (lowercase, удаление спецсимволов)
    - Фильтровать дубликаты
    - Возвращать массив нормализованных тегов
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ] 8.2 Реализовать extractKeywords() для простого извлечения
    - Извлекать ключевые слова без AI (fallback)
    - Использовать частотный анализ
    - Возвращать топ 3-5 слов
    - _Requirements: 8.1_

  - [ ] 8.3 Реализовать normalizeTag() для нормализации
    - Конвертировать в lowercase
    - Удалять специальные символы
    - Обрезать пробелы
    - Ограничивать длину (max 50 символов)
    - _Requirements: 8.1_

  - [ ]* 8.4 Написать unit tests для Tag Service
    - Тестировать нормализацию тегов
    - Тестировать извлечение ключевых слов
    - Тестировать фильтрацию дубликатов

- [ ] 9. Создание Search Service (lib/search.js)
  - [ ] 9.1 Реализовать fulltextSearch() для полнотекстового поиска
    - Использовать PostgreSQL full-text search (to_tsvector)
    - Поддерживать фильтры: type, tags, fromDate, toDate
    - Ранжировать результаты по релевантности (ts_rank)
    - Реализовать пагинацию (limit, offset)
    - Возвращать { results, total, has_more }
    - Завершать в течение 3 секунд
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.8, 9.9_

  - [ ]* 9.2 Написать property test для fulltextSearch
    - **Property 23: Search Result Relevance Ordering**
    - **Validates: Requirements 9.10**

  - [ ] 9.3 Реализовать highlightMatches() для подсветки
    - Находить совпадения query в content
    - Оборачивать в <mark> теги
    - Возвращать контекст вокруг совпадений
    - _Requirements: 9.7_

  - [ ]* 9.4 Написать unit tests для Search Service
    - Тестировать поиск по различным запросам
    - Тестировать фильтрацию
    - Тестировать пагинацию
    - Тестировать подсветку совпадений


- [ ] 10. Создание Export Service (lib/export.js)
  - [ ] 10.1 Реализовать exportToTxt() для TXT экспорта
    - Форматировать сообщения в хронологическом порядке
    - Включать timestamps и роли (User/Bot)
    - Форматировать как читаемый текст
    - Возвращать string
    - _Requirements: 4.1, 4.15_

  - [ ] 10.2 Реализовать exportToJson() для JSON экспорта
    - Сериализовать сообщения с полными метаданными
    - Включать user info, timestamps, tags
    - Форматировать с pretty-print (2 spaces indent)
    - Возвращать string
    - _Requirements: 4.2_

  - [ ]* 10.3 Написать property test для exportToJson
    - **Property 14: Export Round-Trip Preservation**
    - **Validates: Requirements 4.9**

  - [ ] 10.4 Реализовать exportToPdf() для PDF экспорта
    - Использовать библиотеку pdfkit или puppeteer
    - Форматировать с заголовками и timestamps
    - Включать оглавление для длинных документов
    - Возвращать Buffer
    - _Requirements: 4.3_

  - [ ] 10.5 Реализовать uploadExport() для загрузки в Storage
    - Загружать файл в bucket exports
    - Генерировать имя: {user_id}/{export_id}_{timestamp}.{format}
    - Устанавливать expiration 7 дней
    - Сохранять запись в export_history
    - Возвращать { fileUrl, expiresAt }
    - _Requirements: 4.7_

  - [ ] 10.6 Реализовать applyFilters() для фильтрации сообщений
    - Фильтровать по дате (fromDate, toDate)
    - Фильтровать по типу (text, voice, image, document)
    - Фильтровать по тегам
    - Возвращать отфильтрованный массив сообщений
    - _Requirements: 4.4, 4.5, 4.6_

  - [ ]* 10.7 Написать property test для applyFilters
    - **Property 13: Export Filtering Correctness**
    - **Validates: Requirements 4.4, 4.5, 4.6**

  - [ ] 10.8 Реализовать splitLargeExport() для разделения больших файлов
    - Проверять размер файла (> 50MB)
    - Разделять на части по 50MB
    - Нумеровать части (part1, part2, ...)
    - Возвращать массив файлов
    - _Requirements: 4.8_

  - [ ]* 10.9 Написать unit tests для Export Service
    - Тестировать экспорт в каждый формат
    - Тестировать фильтрацию
    - Тестировать разделение больших файлов

- [ ] 11. Checkpoint - Проверка Export Service
  - Убедиться что все форматы экспорта работают
  - Проверить что фильтры применяются корректно
  - Спросить пользователя если возникли вопросы


- [ ] 12. Обновление Webhook Handler (api/webhook.js)
  - [ ] 12.1 Интегрировать Database Service
    - Заменить in-memory context на db.getHistory()
    - Сохранять все сообщения через db.saveMessage()
    - Получать или создавать пользователя через db.getOrCreateUser()
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 12.2 Добавить обработку голосовых сообщений
    - Использовать voice.downloadVoiceFile() для загрузки
    - Использовать voice.transcribe() для транскрипции
    - Использовать voice.saveVoiceMessage() для сохранения
    - Отправлять транскрипцию пользователю
    - Обрабатывать ошибки с retry
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.7_

  - [ ] 12.3 Добавить автоматическую генерацию тегов
    - Вызывать tag.generateTags() после сохранения сообщения
    - Сохранять теги через db.saveTags()
    - Выполнять асинхронно (не блокировать ответ)
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 12.4 Добавить команду /summary
    - Парсить параметр N (количество сообщений, default: 20)
    - Загружать последние N сообщений через db.getHistory()
    - Вызывать ai.createSummary() с параметром detailLevel
    - Отправлять summary пользователю
    - Сохранять summary в базу данных
    - Обрабатывать ошибки (недостаточно сообщений, timeout)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ] 12.5 Добавить команду /analyze
    - Парсить текст для анализа (из сообщения или reply)
    - Вызывать ai.analyzeText() с параметром analysisType
    - Форматировать результаты анализа
    - Отправлять результаты пользователю
    - Обрабатывать ошибки (недостаточно текста)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ] 12.6 Добавить команду /generate
    - Парсить параметры: contentType, length, tone
    - Вызывать ai.generateContent() с параметрами
    - Отправлять сгенерированный контент пользователю
    - Сохранять промпт и результат в базу
    - Обрабатывать ошибки (превышение лимита токенов)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ] 12.7 Добавить команду /language
    - Отображать текущий язык пользователя
    - Позволять выбрать язык (ru/en) через inline keyboard
    - Сохранять выбор через db.updateUserSettings()
    - Применять язык к последующим сообщениям
    - _Requirements: 16.1, 16.2, 16.3, 16.6_

  - [ ] 12.8 Добавить обработку ошибок и логирование
    - Логировать все ошибки с user_id и timestamp
    - Отправлять понятные сообщения об ошибках пользователю
    - Локализовать сообщения об ошибках
    - Реализовать graceful degradation (fallback на in-memory при ошибке БД)
    - _Requirements: 1.6, 16.8_

  - [ ]* 12.9 Написать integration tests для webhook
    - Тестировать обработку текстовых сообщений
    - Тестировать обработку голосовых сообщений
    - Тестировать все команды
    - Тестировать обработку ошибок

- [ ] 13. Checkpoint - Проверка Webhook Handler
  - Убедиться что все команды работают
  - Проверить что сообщения сохраняются в БД
  - Спросить пользователя если возникли вопросы


- [ ] 14. Создание History API (api/history.js)
  - [ ] 14.1 Реализовать GET /api/history endpoint
    - Валидировать Telegram WebApp initData
    - Извлекать user_id из initData
    - Парсить query parameters (limit, offset, type, from_date, to_date)
    - Вызывать db.getHistory() с параметрами
    - Возвращать { messages, total, has_more }
    - Обрабатывать ошибки (401, 500)
    - _Requirements: 1.4, 1.5, 10.1_

  - [ ]* 14.2 Написать unit tests для History API
    - Тестировать успешное получение истории
    - Тестировать пагинацию
    - Тестировать фильтрацию
    - Тестировать валидацию initData
    - Тестировать обработку ошибок

- [ ] 15. Создание Stats API (api/stats.js)
  - [ ] 15.1 Реализовать GET /api/stats endpoint
    - Валидировать Telegram WebApp initData
    - Извлекать user_id из initData
    - Парсить query parameter period (day, week, month, all)
    - Вызывать db.getUserStats() с параметром period
    - Возвращать полную статистику (by_type, by_command, tokens, latency, by_hour, by_day)
    - Обрабатывать ошибки
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 15.2 Написать unit tests для Stats API
    - Тестировать получение статистики за разные периоды
    - Тестировать корректность вычислений
    - Тестировать обработку ошибок

- [ ] 16. Создание Search API (api/search.js)
  - [ ] 16.1 Реализовать POST /api/search endpoint
    - Валидировать Telegram WebApp initData
    - Извлекать user_id из initData
    - Парсить request body (query, filters, search_type, limit, offset)
    - Вызывать search.fulltextSearch() с параметрами
    - Применять highlightMatches() к результатам
    - Возвращать { results, total, has_more }
    - Обрабатывать ошибки (invalid query, timeout)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.7, 9.8, 9.9_

  - [ ]* 16.2 Написать unit tests для Search API
    - Тестировать поиск с различными запросами
    - Тестировать фильтрацию
    - Тестировать пагинацию
    - Тестировать обработку ошибок

- [ ] 17. Создание Export API (api/export.js)
  - [ ] 17.1 Реализовать POST /api/export endpoint
    - Валидировать Telegram WebApp initData
    - Извлекать user_id из initData
    - Парсить request body (format, filters)
    - Загружать сообщения через db.getHistory() с фильтрами
    - Применять export.applyFilters()
    - Вызывать соответствующую функцию экспорта (exportToTxt/Json/Pdf)
    - Проверять размер файла и разделять если > 50MB
    - Загружать файл через export.uploadExport()
    - Возвращать { file_url, file_size, expires_at }
    - Обрабатывать ошибки (timeout, storage failure)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 17.2 Написать unit tests для Export API
    - Тестировать экспорт в каждый формат
    - Тестировать фильтрацию
    - Тестировать разделение больших файлов
    - Тестировать обработку ошибок

- [ ] 18. Создание Settings API (api/settings.js)
  - [ ] 18.1 Реализовать GET /api/settings endpoint
    - Валидировать Telegram WebApp initData
    - Извлекать user_id из initData
    - Вызывать db.getUserSettings()
    - Возвращать settings объект
    - _Requirements: 11.1, 11.7_

  - [ ] 18.2 Реализовать PUT /api/settings endpoint
    - Валидировать Telegram WebApp initData
    - Извлекать user_id из initData
    - Парсить request body (language, ai_settings, preferences)
    - Валидировать temperature (0.0-2.0)
    - Вызывать db.updateUserSettings()
    - Возвращать { success, settings }
    - _Requirements: 11.2, 11.5, 11.6, 11.8_

  - [ ]* 18.3 Написать property test для Settings API
    - **Property 28: Temperature Range Validation**
    - **Validates: Requirements 11.2**

  - [ ]* 18.4 Написать unit tests для Settings API
    - Тестировать получение настроек
    - Тестировать обновление настроек
    - Тестировать валидацию
    - Тестировать обработку ошибок

- [ ] 19. Checkpoint - Проверка всех API endpoints
  - Убедиться что все API работают корректно
  - Проверить валидацию Telegram WebApp initData
  - Спросить пользователя если возникли вопросы


- [ ] 20. Обновление Mini App Frontend (miniapp/index.html)
  - [ ] 20.1 Создать структуру HTML с секциями
    - Создать header с навигацией (History, Search, Stats, Settings)
    - Создать main container для контента
    - Создать footer с информацией
    - Добавить loading indicators
    - Добавить error messages container
    - _Requirements: 10.1_

  - [ ] 20.2 Добавить базовые стили (miniapp/styles.css)
    - Создать CSS переменные для light/dark темы
    - Стилизовать навигацию и секции
    - Добавить responsive стили (320px-1920px)
    - Добавить анимации для transitions
    - Стилизовать кнопки, формы, карточки сообщений
    - _Requirements: 10.8, 10.11_

  - [ ]* 20.3 Написать unit tests для CSS
    - Тестировать responsive breakpoints
    - Тестировать переключение тем

- [ ] 21. Создание Mini App API Client (miniapp/api.js)
  - [ ] 21.1 Реализовать initTelegramWebApp()
    - Инициализировать Telegram.WebApp
    - Получать initData для аутентификации
    - Извлекать user_id
    - Настраивать theme colors
    - _Requirements: 10.1_

  - [ ] 21.2 Реализовать fetchHistory()
    - Отправлять GET /api/history с параметрами
    - Включать initData в headers
    - Обрабатывать пагинацию
    - Возвращать { messages, total, has_more }
    - Обрабатывать ошибки
    - _Requirements: 10.1, 10.2_

  - [ ] 21.3 Реализовать fetchStats()
    - Отправлять GET /api/stats с параметром period
    - Включать initData в headers
    - Возвращать статистику
    - Обрабатывать ошибки
    - _Requirements: 10.7_

  - [ ] 21.4 Реализовать searchMessages()
    - Отправлять POST /api/search с query и filters
    - Включать initData в headers
    - Возвращать { results, total, has_more }
    - Обрабатывать ошибки
    - _Requirements: 10.3_

  - [ ] 21.5 Реализовать exportData()
    - Отправлять POST /api/export с format и filters
    - Включать initData в headers
    - Возвращать { file_url, file_size, expires_at }
    - Обрабатывать ошибки
    - _Requirements: 10.6_

  - [ ] 21.6 Реализовать fetchSettings() и updateSettings()
    - Отправлять GET/PUT /api/settings
    - Включать initData в headers
    - Возвращать settings объект
    - Обрабатывать ошибки
    - _Requirements: 11.1, 11.5_

  - [ ]* 21.7 Написать unit tests для API Client
    - Тестировать все API вызовы
    - Тестировать обработку ошибок
    - Тестировать включение initData


- [ ] 22. Создание Mini App Logic (miniapp/app.js)
  - [ ] 22.1 Реализовать History View
    - Загружать историю через api.fetchHistory()
    - Отображать сообщения в хронологическом порядке
    - Реализовать infinite scroll для пагинации
    - Отображать preview для каждого диалога
    - Показывать timestamps и типы сообщений
    - Обрабатывать loading и error states
    - _Requirements: 10.1, 10.2, 10.5_

  - [ ] 22.2 Реализовать Search View
    - Создать search input с debounce (300ms)
    - Отображать фильтры (date, type, tags)
    - Вызывать api.searchMessages() при вводе
    - Отображать результаты с highlights
    - Реализовать пагинацию результатов
    - Обрабатывать loading и error states
    - _Requirements: 10.3, 10.4_

  - [ ] 22.3 Реализовать Stats View
    - Загружать статистику через api.fetchStats()
    - Отображать графики (Chart.js или аналог)
    - Показывать by_type, by_command, by_hour, by_day
    - Добавить переключатель периода (day, week, month, all)
    - Отображать total_tokens и avg_response_time
    - Обрабатывать loading и error states
    - _Requirements: 10.7_

  - [ ] 22.4 Реализовать Settings View
    - Загружать настройки через api.fetchSettings()
    - Отображать AI settings (temperature, model)
    - Добавить slider для temperature (0.0-2.0)
    - Отображать описание влияния temperature
    - Добавить переключатель темы (light/dark)
    - Добавить переключатель языка (ru/en)
    - Сохранять изменения через api.updateSettings()
    - Добавить кнопку "Reset to defaults"
    - Обрабатывать loading и error states
    - _Requirements: 11.1, 11.2, 11.3, 11.7, 11.8_

  - [ ] 22.5 Реализовать Export функциональность
    - Добавить кнопку Export в History View
    - Отображать modal с выбором формата (TXT, JSON, PDF)
    - Отображать фильтры (date, type, tags)
    - Вызывать api.exportData() с параметрами
    - Показывать progress indicator
    - Отображать ссылку на скачивание после завершения
    - Обрабатывать ошибки (timeout, large file)
    - _Requirements: 10.6_

  - [ ] 22.6 Реализовать Theme Switching
    - Загружать сохраненную тему из localStorage
    - Применять CSS переменные для темы
    - Сохранять выбор в localStorage
    - Синхронизировать с Telegram theme
    - _Requirements: 10.8, 10.9_

  - [ ]* 22.7 Написать property test для localStorage
    - **Property 33: Mini App LocalStorage Round-Trip**
    - **Validates: Requirements 10.9**

  - [ ] 22.7 Реализовать Navigation
    - Переключение между секциями (History, Search, Stats, Settings)
    - Обновление active state в навигации
    - Сохранение текущей секции в URL hash
    - Восстановление секции при загрузке
    - _Requirements: 10.1_

  - [ ] 22.8 Реализовать Error Handling
    - Отображать понятные сообщения об ошибках
    - Локализовать сообщения (ru/en)
    - Добавить retry кнопки для failed requests
    - Логировать ошибки в console
    - _Requirements: 10.1_

  - [ ]* 22.9 Написать unit tests для Mini App Logic
    - Тестировать каждый view
    - Тестировать navigation
    - Тестировать theme switching
    - Тестировать error handling

- [ ] 23. Checkpoint - Проверка Mini App
  - Убедиться что все секции работают
  - Проверить responsive design на разных экранах
  - Проверить переключение тем
  - Спросить пользователя если возникли вопросы


- [ ] 24. Добавление Multilingual Support
  - [ ] 24.1 Создать translations файл (lib/i18n.js)
    - Создать объект с переводами для ru и en
    - Включить все системные сообщения
    - Включить сообщения об ошибках
    - Включить UI labels для Mini App
    - Экспортировать функцию t(key, lang)
    - _Requirements: 16.1, 16.8_

  - [ ] 24.2 Интегрировать i18n в Webhook Handler
    - Определять язык из user settings или Telegram
    - Использовать t() для всех сообщений пользователю
    - Применять язык к AI ответам
    - _Requirements: 16.2, 16.4, 16.5, 16.7_

  - [ ] 24.3 Интегрировать i18n в Mini App
    - Загружать язык из user settings
    - Применять переводы к UI элементам
    - Обновлять UI при смене языка
    - _Requirements: 16.4_

  - [ ]* 24.4 Написать property test для language matching
    - **Property 29: Language Response Matching**
    - **Validates: Requirements 16.5, 16.7**

  - [ ]* 24.5 Написать unit tests для i18n
    - Тестировать переводы для обоих языков
    - Тестировать fallback на default язык
    - Тестировать missing keys

- [ ] 25. Оптимизация производительности
  - [ ] 25.1 Добавить database indexes
    - Проверить что все indexes из schema созданы
    - Добавить composite indexes для частых запросов
    - Создать materialized view для user_stats
    - Настроить auto-refresh для materialized view
    - _Requirements: Performance Requirements_

  - [ ] 25.2 Реализовать caching для частых запросов
    - Кэшировать user settings (5 min TTL)
    - Кэшировать tag lists (10 min TTL)
    - Кэшировать stats (1 hour TTL)
    - Использовать in-memory cache (Map)
    - Реализовать cache invalidation при обновлении
    - _Requirements: Performance Requirements_

  - [ ] 25.3 Оптимизировать API responses
    - Минимизировать размер JSON responses
    - Использовать compression (gzip)
    - Реализовать pagination для всех list endpoints
    - Добавить ETag headers для caching
    - _Requirements: Performance Requirements_

  - [ ] 25.4 Оптимизировать Mini App загрузку
    - Минифицировать JavaScript и CSS
    - Использовать lazy loading для images
    - Реализовать service worker для offline support
    - Добавить preload для критических ресурсов
    - _Requirements: 10.10_

  - [ ]* 25.5 Написать performance tests
    - Тестировать response times для каждого endpoint
    - Тестировать database query performance
    - Тестировать Mini App load time


- [ ] 26. Добавление Security мер
  - [ ] 26.1 Реализовать Telegram webhook signature validation
    - Валидировать X-Telegram-Bot-Api-Secret-Token header
    - Отклонять запросы с невалидной подписью
    - Логировать попытки несанкционированного доступа
    - _Requirements: Security Requirements_

  - [ ] 26.2 Реализовать Telegram WebApp initData validation
    - Валидировать hash signature в initData
    - Проверять timestamp (не старше 1 часа)
    - Извлекать user_id безопасно
    - Отклонять невалидные запросы с 401
    - _Requirements: Security Requirements_

  - [ ] 26.3 Реализовать rate limiting
    - Ограничить messages: 60 per minute per user
    - Ограничить API requests: 100 per minute per user
    - Ограничить exports: 10 per hour per user
    - Ограничить search queries: 30 per minute per user
    - Использовать in-memory counter (Map с TTL)
    - Возвращать 429 с retry_after header
    - _Requirements: Security Requirements_

  - [ ] 26.4 Реализовать input validation
    - Валидировать все query parameters
    - Валидировать все request bodies
    - Санитизировать HTML/markdown в сообщениях
    - Проверять file types и sizes
    - Использовать parameterized queries для SQL
    - _Requirements: Security Requirements_

  - [ ] 26.5 Реализовать data encryption
    - Шифровать OAuth tokens перед сохранением (будущее P2)
    - Использовать HTTPS для всех connections
    - Настроить TLS для database connections
    - _Requirements: Security Requirements_

  - [ ]* 26.6 Написать security tests
    - Тестировать webhook signature validation
    - Тестировать initData validation
    - Тестировать rate limiting
    - Тестировать input validation
    - Тестировать SQL injection protection

- [ ] 27. Checkpoint - Проверка Security и Performance
  - Убедиться что все security меры работают
  - Проверить performance metrics
  - Спросить пользователя если возникли вопросы


- [ ] 28. Создание тестовой инфраструктуры
  - [ ] 28.1 Настроить Vitest
    - Установить vitest и зависимости
    - Создать vitest.config.js
    - Настроить test environment (node)
    - Настроить coverage reporting
    - _Requirements: Testing Strategy_

  - [ ] 28.2 Настроить fast-check для property-based tests
    - Установить fast-check
    - Создать arbitraries для domain objects (tests/fixtures/arbitraries.js)
    - Настроить минимум 100 iterations
    - Настроить seed-based reproducibility
    - _Requirements: Testing Strategy_

  - [ ] 28.3 Создать test fixtures
    - Создать fixtures для users (tests/fixtures/users.js)
    - Создать fixtures для messages (tests/fixtures/messages.js)
    - Создать mock functions для external APIs
    - _Requirements: Testing Strategy_

  - [ ] 28.4 Настроить test database
    - Создать отдельный Supabase проект для тестов
    - Создать script для reset schema
    - Создать script для seed test data
    - Настроить environment variables для тестов
    - _Requirements: Testing Strategy_

  - [ ] 28.5 Создать CI/CD pipeline
    - Создать GitHub Actions workflow
    - Настроить запуск тестов на push
    - Настроить coverage reporting
    - Настроить auto-deploy на Vercel при успешных тестах
    - _Requirements: Testing Strategy_

- [ ] 29. Документация и финальная проверка
  - [ ] 29.1 Обновить README.md
    - Описать новые функции v4.0
    - Добавить инструкции по настройке database
    - Добавить инструкции по настройке environment variables
    - Добавить примеры использования новых команд
    - Добавить troubleshooting секцию

  - [ ] 29.2 Создать API документацию
    - Документировать все API endpoints
    - Добавить примеры requests/responses
    - Описать error codes
    - Добавить rate limiting информацию

  - [ ] 29.3 Создать CHANGELOG.md
    - Перечислить все новые функции
    - Описать breaking changes (если есть)
    - Добавить migration guide с v3.1

  - [ ] 29.4 Провести финальное тестирование
    - Протестировать все P0 функции вручную
    - Протестировать все P1 функции вручную
    - Проверить работу на разных устройствах
    - Проверить производительность под нагрузкой
    - Проверить все error scenarios

  - [ ] 29.5 Подготовить deployment
    - Проверить все environment variables в Vercel
    - Проверить database migrations
    - Создать backup текущей версии
    - Подготовить rollback plan

- [ ] 30. Final Checkpoint - Готовность к релизу
  - Убедиться что все P0 и P1 функции работают
  - Проверить что все тесты проходят
  - Проверить документацию
  - Спросить пользователя о готовности к deployment


## Notes

- Задачи помеченные `*` являются опциональными и могут быть пропущены для более быстрого MVP
- Каждая задача ссылается на конкретные requirements для трассируемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные correctness properties
- Unit tests валидируют конкретные примеры и edge cases
- Все задачи используют JavaScript/Node.js как указано в design.md

## Implementation Order

Задачи организованы в логическом порядке для инкрементальной разработки:

1. **Phase 1 (Tasks 1-7)**: Core Infrastructure
   - Database setup и основные сервисы
   - Voice processing и storage
   - AI service расширения

2. **Phase 2 (Tasks 8-19)**: Advanced Features
   - Tag, Search, Export сервисы
   - Webhook handler обновления
   - Все API endpoints

3. **Phase 3 (Tasks 20-23)**: Mini App
   - Frontend структура и стили
   - API client
   - Application logic

4. **Phase 4 (Tasks 24-27)**: Polish & Security
   - Multilingual support
   - Performance optimization
   - Security measures

5. **Phase 5 (Tasks 28-30)**: Testing & Deployment
   - Test infrastructure
   - Documentation
   - Final validation

## Future Enhancements (P2/P3)

После завершения Phase 1-4, следующие функции могут быть добавлены:

- **P2 Features**:
  - Google Drive Integration (Requirement 12)
  - Notion Integration (Requirement 13)
  - Text-to-Speech Responses (Requirement 17)
  - Image Recognition (Requirement 18)
  - Document Processing (Requirement 19)

- **P3 Features**:
  - Calendar Reminders (Requirement 14)
  - Webhook System (Requirement 15)
  - Config Parser (Requirement 20)

Эти функции будут добавлены в отдельных итерациях после стабилизации v4.0 MVP.
