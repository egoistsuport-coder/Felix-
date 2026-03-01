# Requirements Document: Felix Bot v4.0

## Introduction

Felix Bot v4.0 представляет собой комплексное расширение функционала Telegram AI-ассистента версии 3.1. Текущая версия включает базовые возможности обработки голосовых сообщений, организации текста, контекстной памяти и простого Mini App. Версия 4.0 добавляет полноценную систему хранения данных, расширенные AI-функции, профессиональный Mini App с аналитикой, интеграции с внешними сервисами и мультимодальные возможности.

## Glossary

- **Felix_Bot**: Telegram AI-ассистент, основная система
- **Database_Service**: Сервис управления PostgreSQL базой данных через Supabase
- **AI_Service**: Сервис обработки AI-запросов через Groq API
- **Mini_App**: Telegram Web App интерфейс для расширенного взаимодействия
- **Storage_Service**: Сервис хранения файлов через Supabase Storage
- **Export_Service**: Сервис экспорта данных в различные форматы
- **Integration_Service**: Сервис интеграции с внешними платформами
- **Voice_Service**: Сервис обработки голосовых сообщений (Whisper Large v3)
- **TTS_Service**: Сервис синтеза речи (Text-to-Speech)
- **Vision_Service**: Сервис распознавания изображений
- **Document_Service**: Сервис обработки документов (PDF, DOCX)
- **Tag_Service**: Сервис автоматической генерации тегов для сообщений
- **Search_Service**: Сервис поиска по истории диалогов
- **Analytics_Service**: Сервис сбора и анализа статистики использования
- **Webhook_Service**: Сервис обработки webhook для внешних интеграций
- **User**: Пользователь Telegram, взаимодействующий с ботом
- **Dialog**: Последовательность сообщений между User и Felix_Bot
- **Message**: Единица коммуникации (текст, голос, изображение, документ)
- **Context_Window**: Набор последних сообщений для поддержания контекста диалога
- **Temperature**: Параметр AI модели, контролирующий креативность ответов (0.0-2.0)

## Requirements

### Requirement 1: Database Integration and Persistence

**User Story:** Как пользователь, я хочу, чтобы все мои диалоги сохранялись в базе данных, чтобы иметь доступ к полной истории общения с ботом.

#### Acceptance Criteria

1. WHEN User отправляет Message, THE Database_Service SHALL сохранить Message в PostgreSQL с timestamp, user_id, message_type и content
2. WHEN Felix_Bot генерирует ответ, THE Database_Service SHALL сохранить ответ с связью к исходному Message
3. THE Database_Service SHALL сохранять метаданные для каждого Message (токены, модель, latency)
4. WHEN User запрашивает историю, THE Database_Service SHALL возвращать Dialog с сохранением хронологического порядка
5. THE Database_Service SHALL обеспечивать изоляцию данных между разными User
6. WHEN происходит ошибка сохранения, THE Database_Service SHALL логировать ошибку и возвращать error code без потери Message
7. THE Database_Service SHALL поддерживать транзакции для атомарного сохранения связанных Message
8. FOR ALL сохраненных Message, чтение из базы данных SHALL возвращать идентичные данные (round-trip property)

### Requirement 2: Voice Message History

**User Story:** Как пользователь, я хочу видеть историю моих голосовых сообщений с транскрипциями, чтобы быстро находить нужную информацию.

#### Acceptance Criteria

1. WHEN User отправляет голосовое сообщение, THE Voice_Service SHALL сохранить audio file в Storage_Service
2. WHEN Voice_Service завершает транскрипцию, THE Database_Service SHALL сохранить transcript с ссылкой на audio file
3. THE Database_Service SHALL сохранять metadata голосового сообщения (duration, file_size, language)
4. WHEN User запрашивает историю голосовых сообщений, THE Database_Service SHALL возвращать список с transcript и audio links
5. THE Storage_Service SHALL обеспечивать доступность audio files в течение минимум 90 дней
6. WHEN audio file удаляется из Storage_Service, THE Database_Service SHALL сохранять transcript
7. FOR ALL голосовых сообщений, размер audio file SHALL быть меньше 20MB (Telegram limit)

### Requirement 3: Usage Statistics and Analytics

**User Story:** Как пользователь, я хочу видеть статистику моего использования бота, чтобы понимать паттерны взаимодействия.

#### Acceptance Criteria

1. THE Analytics_Service SHALL подсчитывать количество Message по типам (text, voice, image, document) для каждого User
2. THE Analytics_Service SHALL отслеживать общее количество токенов, использованных User
3. THE Analytics_Service SHALL вычислять среднее время ответа Felix_Bot для каждого User
4. WHEN User запрашивает статистику, THE Analytics_Service SHALL возвращать данные за указанный период (день, неделя, месяц, все время)
5. THE Analytics_Service SHALL группировать статистику по командам (/organize, /summary, /analyze, /generate)
6. THE Analytics_Service SHALL отслеживать частоту использования различных AI моделей
7. THE Analytics_Service SHALL вычислять распределение Message по часам дня и дням недели
8. FOR ALL статистических вычислений, сумма частей SHALL равняться целому (invariant property)

### Requirement 4: Data Export Functionality

**User Story:** Как пользователь, я хочу экспортировать мои диалоги в различных форматах, чтобы использовать данные вне бота.

#### Acceptance Criteria

1. WHEN User запрашивает экспорт в TXT, THE Export_Service SHALL генерировать текстовый файл с хронологическим списком Message
2. WHEN User запрашивает экспорт в JSON, THE Export_Service SHALL генерировать структурированный JSON с полными метаданными
3. WHEN User запрашивает экспорт в PDF, THE Export_Service SHALL генерировать форматированный PDF документ с timestamps
4. THE Export_Service SHALL поддерживать фильтрацию по дате для экспорта
5. THE Export_Service SHALL поддерживать фильтрацию по типу Message для экспорта
6. THE Export_Service SHALL поддерживать фильтрацию по тегам для экспорта
7. WHEN экспорт завершен, THE Export_Service SHALL отправить файл User через Telegram
8. IF размер экспортного файла превышает 50MB, THEN THE Export_Service SHALL разделить экспорт на несколько файлов
9. FOR ALL экспортированных данных, импорт обратно SHALL восстанавливать исходную структуру (round-trip property)

### Requirement 5: Dialog Summarization

**User Story:** Как пользователь, я хочу получать краткие саммари длинных диалогов, чтобы быстро вспомнить ключевые моменты.

#### Acceptance Criteria

1. WHEN User вызывает команду /summary, THE AI_Service SHALL анализировать последние N Message в Dialog (где N задается User, по умолчанию 20)
2. THE AI_Service SHALL генерировать структурированное summary с ключевыми темами, решениями и action items
3. THE AI_Service SHALL использовать LLaMA 3.3 70B модель для генерации summary
4. WHEN Dialog содержит менее 5 Message, THE Felix_Bot SHALL уведомить User о недостаточном количестве данных
5. THE AI_Service SHALL поддерживать параметр детализации summary (краткое, среднее, подробное)
6. WHEN summary генерируется, THE Database_Service SHALL сохранить summary с ссылкой на исходные Message
7. THE AI_Service SHALL завершать генерацию summary в течение 30 секунд
8. FOR ALL summary, количество токенов SHALL быть меньше количества токенов исходных Message (compression property)

### Requirement 6: Text Analysis

**User Story:** Как пользователь, я хочу анализировать текст на тональность, ключевые слова и структуру, чтобы получать инсайты из контента.

#### Acceptance Criteria

1. WHEN User вызывает команду /analyze с текстом, THE AI_Service SHALL определять тональность (positive, neutral, negative) с confidence score
2. THE AI_Service SHALL извлекать ключевые слова и фразы из текста
3. THE AI_Service SHALL определять основные темы и категории текста
4. THE AI_Service SHALL оценивать читаемость текста (readability score)
5. THE AI_Service SHALL определять язык текста автоматически
6. WHEN текст содержит менее 10 слов, THE Felix_Bot SHALL уведомить User о недостаточном объеме для анализа
7. THE AI_Service SHALL возвращать структурированный результат анализа в течение 15 секунд
8. WHERE User указывает специфический тип анализа, THE AI_Service SHALL фокусироваться на запрошенном аспекте

### Requirement 7: Content Generation

**User Story:** Как пользователь, я хочу генерировать различные типы контента по промптам, чтобы ускорить создание текстов.

#### Acceptance Criteria

1. WHEN User вызывает команду /generate с промптом, THE AI_Service SHALL генерировать контент согласно промпту
2. THE AI_Service SHALL поддерживать типы контента (статья, email, пост в соцсети, код, список идей)
3. WHERE User указывает тип контента, THE AI_Service SHALL применять соответствующий шаблон и стиль
4. THE AI_Service SHALL поддерживать параметр длины генерируемого контента (короткий, средний, длинный)
5. THE AI_Service SHALL поддерживать параметр tone (формальный, неформальный, профессиональный, креативный)
6. WHEN генерация завершена, THE Database_Service SHALL сохранить промпт и результат
7. THE AI_Service SHALL завершать генерацию в течение 45 секунд
8. IF генерация превышает лимит токенов, THEN THE AI_Service SHALL уведомить User и предложить сократить промпт

### Requirement 8: Smart Tagging System

**User Story:** Как пользователь, я хочу, чтобы мои сообщения автоматически тегировались, чтобы легко находить связанные диалоги.

#### Acceptance Criteria

1. WHEN Message сохраняется, THE Tag_Service SHALL автоматически генерировать релевантные теги на основе содержимого
2. THE Tag_Service SHALL извлекать от 1 до 5 тегов для каждого Message
3. THE Tag_Service SHALL использовать AI для определения семантических тегов (не только ключевые слова)
4. THE Database_Service SHALL сохранять связь между Message и тегами
5. WHEN User добавляет ручной тег, THE Database_Service SHALL сохранить тег с пометкой user_defined
6. THE Tag_Service SHALL поддерживать иерархию тегов (категория:подкатегория)
7. WHEN User запрашивает список тегов, THE Tag_Service SHALL возвращать теги с частотой использования
8. FOR ALL автоматических тегов, релевантность SHALL быть выше 0.6 (confidence threshold)

### Requirement 9: History Search

**User Story:** Как пользователь, я хочу искать по истории диалогов, чтобы быстро находить нужную информацию.

#### Acceptance Criteria

1. WHEN User вводит поисковый запрос, THE Search_Service SHALL искать по содержимому всех Message User
2. THE Search_Service SHALL поддерживать полнотекстовый поиск с ранжированием по релевантности
3. THE Search_Service SHALL поддерживать поиск по тегам
4. THE Search_Service SHALL поддерживать фильтрацию по дате (от, до, диапазон)
5. THE Search_Service SHALL поддерживать фильтрацию по типу Message
6. THE Search_Service SHALL поддерживать семантический поиск через AI embeddings
7. WHEN поиск возвращает результаты, THE Search_Service SHALL выделять совпадения в контексте
8. THE Search_Service SHALL возвращать результаты в течение 3 секунд
9. THE Search_Service SHALL поддерживать пагинацию результатов (по 20 на страницу)
10. FOR ALL поисковых запросов, результаты SHALL быть упорядочены по убыванию релевантности (invariant property)

### Requirement 10: Mini App Pro Interface

**User Story:** Как пользователь, я хочу использовать полноценный веб-интерфейс для работы с историей, чтобы иметь удобный доступ ко всем функциям.

#### Acceptance Criteria

1. WHEN User открывает Mini_App, THE Mini_App SHALL отображать список последних Dialog с preview
2. THE Mini_App SHALL поддерживать infinite scroll для загрузки истории
3. THE Mini_App SHALL интегрировать Search_Service для поиска по истории
4. THE Mini_App SHALL отображать фильтры по дате, типу Message и тегам
5. WHEN User выбирает Dialog, THE Mini_App SHALL отображать полную историю с форматированием
6. THE Mini_App SHALL поддерживать экспорт выбранных Dialog через Export_Service
7. THE Mini_App SHALL отображать статистику через Analytics_Service с графиками
8. THE Mini_App SHALL поддерживать переключение между светлой и темной темой
9. THE Mini_App SHALL сохранять предпочтения темы в localStorage
10. THE Mini_App SHALL загружаться в течение 2 секунд на 3G соединении
11. THE Mini_App SHALL быть responsive для экранов от 320px до 1920px ширины

### Requirement 11: AI Settings Configuration

**User Story:** Как пользователь, я хочу настраивать параметры AI, чтобы контролировать стиль и поведение ответов.

#### Acceptance Criteria

1. WHERE User открывает настройки в Mini_App, THE Mini_App SHALL отображать доступные AI параметры
2. THE Mini_App SHALL позволять изменять Temperature от 0.0 до 2.0 с шагом 0.1
3. THE Mini_App SHALL отображать описание влияния Temperature на ответы
4. WHERE доступны несколько моделей, THE Mini_App SHALL позволять выбирать модель
5. THE Database_Service SHALL сохранять настройки User
6. WHEN User изменяет настройки, THE AI_Service SHALL применять новые параметры к последующим запросам
7. THE Mini_App SHALL отображать текущие значения параметров по умолчанию
8. THE Mini_App SHALL позволять сбросить настройки к значениям по умолчанию

### Requirement 12: Google Drive Integration

**User Story:** Как пользователь, я хочу экспортировать документы в Google Drive, чтобы хранить их в облаке.

#### Acceptance Criteria

1. WHEN User авторизует Google Drive, THE Integration_Service SHALL сохранить OAuth токены безопасно
2. WHEN User запрашивает экспорт в Google Drive, THE Integration_Service SHALL создать документ в указанной папке
3. THE Integration_Service SHALL поддерживать экспорт в форматах Google Docs и PDF
4. THE Integration_Service SHALL уведомлять User о успешном экспорте с ссылкой на документ
5. IF OAuth токен истек, THEN THE Integration_Service SHALL запросить повторную авторизацию
6. THE Integration_Service SHALL завершать экспорт в течение 60 секунд
7. WHEN экспорт не удается, THE Integration_Service SHALL предложить альтернативный метод экспорта

### Requirement 13: Notion Integration

**User Story:** Как пользователь, я хочу создавать заметки в Notion из диалогов, чтобы организовывать информацию в моей базе знаний.

#### Acceptance Criteria

1. WHEN User авторизует Notion, THE Integration_Service SHALL сохранить integration token безопасно
2. WHEN User запрашивает создание заметки, THE Integration_Service SHALL отображать список доступных databases
3. WHEN User выбирает database, THE Integration_Service SHALL создать page с содержимым Dialog
4. THE Integration_Service SHALL поддерживать маппинг тегов Felix_Bot на Notion tags
5. THE Integration_Service SHALL сохранять форматирование текста при экспорте
6. THE Integration_Service SHALL уведомлять User о успешном создании с ссылкой на page
7. IF integration token невалиден, THEN THE Integration_Service SHALL запросить повторную авторизацию

### Requirement 14: Calendar Reminders

**User Story:** Как пользователь, я хочу создавать напоминания в календаре из диалогов, чтобы не забывать важные задачи.

#### Acceptance Criteria

1. WHEN User запрашивает создание напоминания, THE Integration_Service SHALL извлекать дату и время из контекста Dialog
2. THE Integration_Service SHALL поддерживать Google Calendar и Outlook Calendar
3. WHEN дата и время не указаны явно, THE Integration_Service SHALL запросить уточнение у User
4. THE Integration_Service SHALL создавать calendar event с title, description и reminder
5. THE Integration_Service SHALL поддерживать recurring events (ежедневно, еженедельно, ежемесячно)
6. THE Integration_Service SHALL уведомлять User о успешном создании события
7. IF создание события не удается, THEN THE Integration_Service SHALL предложить создать локальное напоминание через Telegram

### Requirement 15: Webhook System

**User Story:** Как разработчик, я хочу получать webhook уведомления о событиях в боте, чтобы интегрировать Felix_Bot с внешними системами.

#### Acceptance Criteria

1. WHERE User настраивает webhook URL, THE Webhook_Service SHALL валидировать URL формат
2. WHEN происходит событие (новый Message, завершение AI запроса), THE Webhook_Service SHALL отправлять POST запрос на webhook URL
3. THE Webhook_Service SHALL включать payload с event type, timestamp и данными события
4. THE Webhook_Service SHALL подписывать payload с HMAC для верификации
5. IF webhook URL не отвечает в течение 10 секунд, THEN THE Webhook_Service SHALL повторить попытку до 3 раз с exponential backoff
6. THE Webhook_Service SHALL логировать все webhook вызовы с response status
7. WHERE User указывает фильтры событий, THE Webhook_Service SHALL отправлять только соответствующие события
8. THE Database_Service SHALL сохранять webhook конфигурацию User

### Requirement 16: Multilingual Support

**User Story:** Как пользователь, я хочу использовать бота на русском или английском языке, чтобы общаться на удобном языке.

#### Acceptance Criteria

1. THE Felix_Bot SHALL поддерживать русский и английский языки для интерфейса
2. WHEN User впервые взаимодействует с Felix_Bot, THE Felix_Bot SHALL определять язык из Telegram settings
3. THE Felix_Bot SHALL позволять User изменять язык через команду /language
4. THE Mini_App SHALL отображать интерфейс на выбранном языке
5. THE AI_Service SHALL отвечать на языке Message от User
6. THE Database_Service SHALL сохранять языковые предпочтения User
7. WHERE User отправляет Message на другом языке, THE AI_Service SHALL автоматически переключаться на этот язык для ответа
8. THE Felix_Bot SHALL переводить системные сообщения и ошибки на выбранный язык

### Requirement 17: Text-to-Speech Responses

**User Story:** Как пользователь, я хочу получать голосовые ответы от бота, чтобы слушать их вместо чтения.

#### Acceptance Criteria

1. WHEN User запрашивает голосовой ответ через команду /voice, THE TTS_Service SHALL конвертировать текстовый ответ в audio
2. THE TTS_Service SHALL поддерживать русский и английский языки
3. THE TTS_Service SHALL автоматически определять язык текста для синтеза
4. THE TTS_Service SHALL генерировать audio в формате OGG (Telegram voice message format)
5. WHEN audio генерируется, THE Storage_Service SHALL сохранить audio file
6. THE Felix_Bot SHALL отправлять audio как голосовое сообщение User
7. THE TTS_Service SHALL завершать синтез в течение 20 секунд
8. WHERE текст превышает 4096 символов, THE TTS_Service SHALL разделить на несколько голосовых сообщений
9. THE Database_Service SHALL сохранять связь между текстовым ответом и audio file

### Requirement 18: Image Recognition

**User Story:** Как пользователь, я хочу отправлять изображения боту для анализа, чтобы получать описания и инсайты.

#### Acceptance Criteria

1. WHEN User отправляет изображение, THE Vision_Service SHALL загружать image из Telegram
2. THE Vision_Service SHALL анализировать содержимое image с использованием vision AI модели
3. THE Vision_Service SHALL генерировать текстовое описание image
4. THE Vision_Service SHALL извлекать текст из image (OCR) если присутствует
5. THE Vision_Service SHALL определять объекты, людей и сцены на image
6. WHEN User задает вопрос об image, THE AI_Service SHALL использовать результаты Vision_Service для ответа
7. THE Storage_Service SHALL сохранять image в течение 30 дней
8. THE Database_Service SHALL сохранять результаты анализа image с ссылкой на file
9. THE Vision_Service SHALL завершать анализ в течение 30 секунд
10. IF image размером более 20MB, THEN THE Felix_Bot SHALL уведомить User о превышении лимита

### Requirement 19: Document Processing

**User Story:** Как пользователь, я хочу отправлять PDF и DOCX документы для анализа, чтобы извлекать информацию и получать саммари.

#### Acceptance Criteria

1. WHEN User отправляет PDF документ, THE Document_Service SHALL извлекать текст из PDF
2. WHEN User отправляет DOCX документ, THE Document_Service SHALL извлекать текст и структуру из DOCX
3. THE Document_Service SHALL сохранять форматирование (заголовки, списки, таблицы) при извлечении
4. WHEN извлечение завершено, THE AI_Service SHALL генерировать summary документа
5. THE AI_Service SHALL отвечать на вопросы User о содержимом документа
6. THE Storage_Service SHALL сохранять документ в течение 30 дней
7. THE Database_Service SHALL сохранять извлеченный текст и metadata документа
8. THE Document_Service SHALL завершать извлечение в течение 60 секунд
9. IF документ размером более 50MB, THEN THE Felix_Bot SHALL уведомить User о превышении лимита
10. WHERE документ защищен паролем, THE Document_Service SHALL запросить пароль у User

### Requirement 20: Parser and Pretty Printer for Configuration

**User Story:** Как разработчик, я хочу парсить конфигурационные файлы пользовательских настроек, чтобы загружать и сохранять параметры.

#### Acceptance Criteria

1. WHEN конфигурационный файл предоставлен, THE Config_Parser SHALL парсить его в Configuration объект
2. WHEN конфигурационный файл невалиден, THE Config_Parser SHALL возвращать описательную ошибку с указанием строки
3. THE Config_Pretty_Printer SHALL форматировать Configuration объекты обратно в валидные конфигурационные файлы
4. FOR ALL валидных Configuration объектов, парсинг затем печать затем парсинг SHALL производить эквивалентный объект (round-trip property)
5. THE Config_Parser SHALL поддерживать JSON формат конфигурации
6. THE Config_Pretty_Printer SHALL сохранять читаемое форматирование с отступами
7. THE Config_Parser SHALL валидировать типы данных параметров согласно схеме

## Priority Classification

### P0 (Critical - Must Have for v4.0)
- Requirement 1: Database Integration and Persistence
- Requirement 2: Voice Message History
- Requirement 4: Data Export Functionality
- Requirement 5: Dialog Summarization
- Requirement 10: Mini App Pro Interface

### P1 (High - Should Have for v4.0)
- Requirement 3: Usage Statistics and Analytics
- Requirement 6: Text Analysis
- Requirement 7: Content Generation
- Requirement 8: Smart Tagging System
- Requirement 9: History Search
- Requirement 11: AI Settings Configuration
- Requirement 16: Multilingual Support

### P2 (Medium - Nice to Have for v4.0)
- Requirement 12: Google Drive Integration
- Requirement 13: Notion Integration
- Requirement 17: Text-to-Speech Responses
- Requirement 18: Image Recognition
- Requirement 19: Document Processing

### P3 (Low - Future Enhancement)
- Requirement 14: Calendar Reminders
- Requirement 15: Webhook System
- Requirement 20: Parser and Pretty Printer for Configuration

## Technical Constraints

1. Backend SHALL работать на Node.js в Vercel Serverless Functions
2. Database SHALL использовать PostgreSQL через Supabase
3. AI модели SHALL использоваться через Groq API
4. Storage SHALL использовать Supabase Storage
5. Mini_App SHALL использовать Vanilla JavaScript и Telegram WebApp API
6. Все API endpoints SHALL завершаться в течение Vercel timeout (10 секунд для Hobby, 60 секунд для Pro)
7. Все персональные данные SHALL храниться с шифрованием
8. Все внешние интеграции SHALL использовать OAuth 2.0 для авторизации

## Performance Requirements

1. Database queries SHALL выполняться в течение 500ms для 95% запросов
2. AI responses SHALL генерироваться в течение 30 секунд для 90% запросов
3. Mini_App SHALL загружаться в течение 2 секунд на 3G соединении
4. Search results SHALL возвращаться в течение 3 секунд
5. Export operations SHALL завершаться в течение 60 секунд для файлов до 10MB

## Security Requirements

1. Все OAuth токены SHALL храниться в зашифрованном виде
2. Все API endpoints SHALL валидировать Telegram webhook signature
3. Все пользовательские данные SHALL быть изолированы по user_id
4. Все webhook payloads SHALL подписываться с HMAC
5. Все файлы в Storage SHALL иметь ограниченный срок жизни
