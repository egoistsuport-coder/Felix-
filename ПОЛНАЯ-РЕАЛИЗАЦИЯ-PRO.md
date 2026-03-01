# 💎 ПОЛНАЯ РЕАЛИЗАЦИЯ PRO - Готовый код

## 🎯 Парсинг опций из команды

```javascript
// Универсальный парсер опций
function parseCommandOptions(text, commandName) {
  const regex = new RegExp(`^/${commandName}(?::([^\\s]+))?\\s+(.+)$`);
  const match = text.match(regex);
  
  if (!match) return null;
  
  const [, optionsStr, content] = match;
  const options = {};
  
  if (optionsStr) {
    const parts = optionsStr.split(':');
    parts.forEach(part => {
      if (part.includes('=')) {
        const [key, value] = part.split('=');
        options[key] = value;
      } else {
        options[part] = true;
      }
    });
  }
  
  return { options, content };
}

// Примеры использования:
// /translate:en:formal Текст → { options: { en: true, formal: true }, content: 'Текст' }
// /improve:grammar:explain Текст → { options: { grammar: true, explain: true }, content: 'Текст' }
// /brainstorm:count=20:rate Тема → { options: { count: '20', rate: true }, content: 'Тема' }
```

---

## 1. 🌐 /translate PRO - Полный код

```javascript
async function translateTextPro(text, options = {}) {
  const {
    targetLang = 'en',
    sourceLang = 'auto',
    formal = false,
    casual = false,
    technical = false,
    literary = false,
    verify = false,
    context = ''
  } = options;

  // Определение стиля
  let style = 'neutral';
  if (formal) style = 'formal';
  else if (casual) style = 'casual';
  else if (technical) style = 'technical';
  else if (literary) style = 'literary';

  const stylePrompts = {
    formal: 'Используй формальный, официальный стиль.',
    casual: 'Используй неформальный, разговорный стиль.',
    technical: 'Используй технический, профессиональный язык.',
    literary: 'Используй литературный, художественный стиль.',
    neutral: 'Используй нейтральный стиль.'
  };

  const contextPrompt = context ? `\nКонтекст: ${context}` : '';
  const sourcePrompt = sourceLang !== 'auto' 
    ? `Исходный язык: ${langNames[sourceLang]}.` 
    : 'Автоматически определи исходный язык.';

  const systemPrompt = `Ты профессиональный переводчик.
${sourcePrompt}
Переведи текст на ${langNames[targetLang]} язык.
${stylePrompts[style]}
${contextPrompt}
Сохрани смысл и нюансы оригинала.`;

  const translation = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 1024
  });

  const result = translation.choices[0]?.message?.content;

  // Обратный перевод для проверки
  if (verify) {
    const backPrompt = `Переведи этот текст обратно на ${sourceLang === 'auto' ? 'исходный' : langNames[sourceLang]} язык:`;
    const backTranslation = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: backPrompt },
        { role: 'user', content: result }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1024
    });

    const back = backTranslation.choices[0]?.message?.content;
    
    return `🌐 <b>Перевод с проверкой:</b>

<b>Оригинал:</b>
${text}

<b>Перевод (${langNames[targetLang]}):</b>
${result}

<b>Обратный перевод:</b>
${back}

<i>💡 Сравните оригинал и обратный перевод для оценки качества</i>`;
  }

  return `🌐 <b>Перевод на ${langNames[targetLang]}:</b>\n\n${result}`;
}

// Обработчик команды
if (text.startsWith('/translate')) {
  updateStats(userId, '/translate');
  
  const parsed = parseCommandOptions(text, 'translate');
  if (!parsed) {
    await sendMessage(chatId, `Используйте: /translate:<язык> <текст>

<b>Доступные языки:</b>
en, ru, es, de, fr, it, pt, zh, ja, ko

<b>Опции:</b>
:formal - формальный стиль
:casual - неформальный стиль
:technical - технический язык
:literary - литературный стиль
:verify - с обратным переводом

<b>Примеры:</b>
/translate:en Привет!
/translate:en:formal Здравствуйте
/translate:en:verify Как дела?`);
    return res.status(200).json({ ok: true });
  }

  const { options, content } = parsed;
  const targetLang = Object.keys(options).find(key => langNames[key]) || 'en';
  
  await sendMessage(chatId, '🔄 Перевожу...');
  
  try {
    const translated = await translateTextPro(content, { targetLang, ...options });
    await sendMessage(chatId, translated);
  } catch (error) {
    console.error('Translation error:', error);
    await sendMessage(chatId, '❌ Ошибка при переводе');
  }
  
  return res.status(200).json({ ok: true });
}
```

---

## 2. ✨ /improve PRO - Полный код

```javascript
async function improveTextPro(text, options = {}) {
  const {
    grammar = false,
    style = false,
    clarity = false,
    concise = false,
    detailed = false,
    professional = false,
    explain = false,
    light = false,
    medium = true,
    heavy = false,
    audience = 'general'
  } = options;

  // Определение режима
  let mode = 'general';
  if (grammar) mode = 'grammar';
  else if (style) mode = 'style';
  else if (clarity) mode = 'clarity';
  else if (concise) mode = 'concise';
  else if (detailed) mode = 'detailed';
  else if (professional) mode = 'professional';

  // Определение уровня
  let level = 'medium';
  if (light) level = 'light';
  else if (heavy) level = 'heavy';

  const modePrompts = {
    general: 'Улучши грамматику, пунктуацию, стиль и читаемость.',
    grammar: 'Исправь только грамматические ошибки и пунктуацию.',
    style: 'Улучши только стиль написания, сделай текст более выразительным.',
    clarity: 'Сделай текст более ясным, понятным и структурированным.',
    concise: 'Сократи текст, убери лишнее, сохрани ключевой смысл.',
    detailed: 'Расширь текст, добавь детали, примеры и пояснения.',
    professional: 'Сделай текст более профессиональным и деловым.'
  };

  const levelPrompts = {
    light: 'Внеси минимальные изменения, только самые критичные.',
    medium: 'Внеси умеренные изменения для заметного улучшения.',
    heavy: 'Максимально улучши текст, можешь значительно переписать.'
  };

  const audiencePrompts = {
    kids: 'Адаптируй для детей (простой, понятный язык).',
    general: 'Адаптируй для широкой аудитории.',
    experts: 'Адаптируй для экспертов (можно использовать термины).'
  };

  const explainPrompt = explain 
    ? '\n\nПосле улучшенного текста добавь раздел:\n\n<b>Что исправлено:</b>\n• Список изменений с объяснениями'
    : '';

  const systemPrompt = `Ты эксперт по редактированию текста.
${modePrompts[mode]}
${levelPrompts[level]}
${audiencePrompts[audience]}
Сохрани смысл и основной тон оригинала.${explainPrompt}`;

  const improved = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.3,
    max_tokens: 1500
  });

  return improved.choices[0]?.message?.content;
}

// Обработчик команды
if (text.startsWith('/improve')) {
  updateStats(userId, '/improve');
  
  const parsed = parseCommandOptions(text, 'improve');
  if (!parsed) {
    await sendMessage(chatId, `Используйте: /improve:<опции> <текст>

<b>Режимы:</b>
:grammar - только грамматика
:style - только стиль
:clarity - ясность
:concise - сократить
:detailed - расширить
:professional - профессиональный

<b>Уровень:</b>
:light - минимальные изменения
:medium - средние (по умолчанию)
:heavy - максимальные

<b>Аудитория:</b>
:audience=kids - для детей
:audience=general - для всех
:audience=experts - для экспертов

<b>Дополнительно:</b>
:explain - с объяснениями

<b>Примеры:</b>
/improve Я пошол в магазин
/improve:grammar:explain Текст
/improve:concise:audience=kids Текст`);
    return res.status(200).json({ ok: true });
  }

  const { options, content } = parsed;
  
  await sendMessage(chatId, '✨ Улучшаю текст...');
  
  try {
    const improved = await improveTextPro(content, options);
    await sendMessage(chatId, `✨ <b>Улучшенный текст:</b>\n\n${improved}`);
  } catch (error) {
    console.error('Improve error:', error);
    await sendMessage(chatId, '❌ Ошибка при улучшении текста');
  }
  
  return res.status(200).json({ ok: true });
}
```

---

## 3. 💡 /brainstorm PRO - Полный код

```javascript
async function brainstormIdeasPro(topic, options = {}) {
  const {
    count = '10',
    categorize = false,
    rate = false,
    detailed = false,
    creative = 'medium'
  } = options;

  const numCount = parseInt(count) || 10;

  const creativitySettings = {
    low: { temp: 0.6, desc: 'практичные, реалистичные' },
    medium: { temp: 0.7, desc: 'сбалансированные' },
    high: { temp: 0.8, desc: 'креативные, необычные' },
    wild: { temp: 0.9, desc: 'безумные, революционные' }
  };

  const setting = creativitySettings[creative] || creativitySettings.medium;

  let systemPrompt = `Ты креативный генератор идей.
Создай ${numCount} ${setting.desc} идей по теме: "${topic}".`;

  if (categorize) {
    systemPrompt += '\n\nГруппируй идеи по логическим категориям.';
  }

  if (rate) {
    systemPrompt += '\n\nДля каждой идеи добавь:\n• Сложность реализации (1-5)\n• Потенциал успеха (1-5)\n• Примерное время реализации';
  }

  if (detailed) {
    systemPrompt += '\n\nДля каждой идеи добавь подробное описание (2-3 предложения) с конкретными шагами.';
  }

  systemPrompt += `\n\nФормат:
${categorize ? '## [Категория]\n' : ''}
${numCount <= 10 ? '1-' + numCount : '1-10, 11-20, ...'}.  [Название идеи]
   ${detailed ? '[Подробное описание]' : '[Краткое описание]'}
   ${rate ? '[⚡ Сложность: X/5 | 🎯 Потенциал: X/5 | ⏱ Время: X]' : ''}`;

  const ideas = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: topic }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: setting.temp,
    max_tokens: numCount > 15 ? 2000 : 1500
  });

  return ideas.choices[0]?.message?.content;
}

// Обработчик команды
if (text.startsWith('/brainstorm')) {
  updateStats(userId, '/brainstorm');
  
  const parsed = parseCommandOptions(text, 'brainstorm');
  if (!parsed) {
    await sendMessage(chatId, `Используйте: /brainstorm:<опции> <тема>

<b>Опции:</b>
:count=N - количество идей (по умолчанию 10)
:categorize - группировать по категориям
:rate - с оценкой сложности и потенциала
:detailed - подробные описания
:creative=low/medium/high/wild - уровень креативности

<b>Примеры:</b>
/brainstorm Идеи для YouTube
/brainstorm:count=20 Бизнес идеи
/brainstorm:categorize:rate Стартап
/brainstorm:detailed:creative=wild Инновации`);
    return res.status(200).json({ ok: true });
  }

  const { options, content } = parsed;
  
  await sendMessage(chatId, '💡 Генерирую идеи...');
  
  try {
    const ideas = await brainstormIdeasPro(content, options);
    await sendMessage(chatId, `💡 <b>Идеи по теме "${content}":</b>\n\n${ideas}`);
  } catch (error) {
    console.error('Brainstorm error:', error);
    await sendMessage(chatId, '❌ Ошибка при генерации идей');
  }
  
  return res.status(200).json({ ok: true });
}
```

---

## 4. 📚 /explain PRO - Полный код

```javascript
async function explainSimplyPro(topic, options = {}) {
  const {
    simple = false,
    medium = false,
    advanced = false,
    expert = false,
    examples = false,
    analogies = false,
    steps = false,
    visual = false
  } = options;

  // Определение уровня
  let level = 'simple';
  if (medium) level = 'medium';
  else if (advanced) level = 'advanced';
  else if (expert) level = 'expert';

  const levelPrompts = {
    simple: 'Объясни так, чтобы понял ребенок 10 лет. Используй простейший язык и избегай терминов.',
    medium: 'Объясни для обычного человека без специальных знаний. Используй доступный язык.',
    advanced: 'Объясни для человека с базовыми знаниями в теме. Можно использовать некоторые термины.',
    expert: 'Объясни для эксперта. Используй технические термины и углубленные детали.'
  };

  let systemPrompt = `Ты эксперт по объяснению сложных вещей.
${levelPrompts[level]}`;

  if (examples) {
    systemPrompt += '\n\nДобавь 2-3 практических примера из реальной жизни для лучшего понимания.';
  }

  if (analogies) {
    systemPrompt += '\n\nИспользуй яркие аналогии и метафоры. Сравнивай с понятными вещами из повседневной жизни.';
  }

  if (steps) {
    systemPrompt += '\n\nРазбей объяснение на пошаговый процесс с нумерацией.';
  }

  if (visual) {
    systemPrompt += '\n\nДобавь текстовые диаграммы, схемы или ASCII-арт где это уместно.';
  }

  systemPrompt += `\n\nСтруктура ответа:
1. 📌 Краткое определение (1-2 предложения)
2. 📖 Подробное объяснение
${examples ? '3. 💡 Примеры из жизни' : ''}
${analogies ? '3. 🔄 Аналогии' : ''}
${steps ? '3. 📋 Пошаговый процесс' : ''}
4. ✨ Ключевые моменты
5. 🎯 Заключение`;

  const explanation = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: topic }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.5,
    max_tokens: 1500
  });

  return explanation.choices[0]?.message?.content;
}

// Обработчик команды
if (text.startsWith('/explain')) {
  updateStats(userId, '/explain');
  
  const parsed = parseCommandOptions(text, 'explain');
  if (!parsed) {
    await sendMessage(chatId, `Используйте: /explain:<опции> <тема>

<b>Уровень сложности:</b>
:simple - для детей (по умолчанию)
:medium - для обычных людей
:advanced - для знающих
:expert - для экспертов

<b>Дополнительно:</b>
:examples - с примерами
:analogies - с аналогиями
:steps - пошагово
:visual - с диаграммами

<b>Примеры:</b>
/explain Квантовая физика
/explain:simple:examples Блокчейн
/explain:analogies:steps Нейросети
/explain:expert:visual Алгоритмы`);
    return res.status(200).json({ ok: true });
  }

  const { options, content } = parsed;
  
  await sendMessage(chatId, '📚 Объясняю...');
  
  try {
    const explanation = await explainSimplyPro(content, options);
    await sendMessage(chatId, `📚 <b>Объяснение "${content}":</b>\n\n${explanation}`);
  } catch (error) {
    console.error('Explain error:', error);
    await sendMessage(chatId, '❌ Ошибка при объяснении');
  }
  
  return res.status(200).json({ ok: true });
}
```

---

## 5. 📊 /stats PRO - Полный код

```javascript
function getDetailedStats(userId, options = {}) {
  const {
    detailed = false,
    chart = false,
    commands = false,
    time = false,
    export: exportFormat = false
  } = options;

  const stats = userStats.get(userId) || {
    totalMessages: 0,
    commands: {},
    voiceMessages: 0,
    startTime: Date.now()
  };

  const sessionTime = Math.floor((Date.now() - stats.startTime) / 1000 / 60);
  const hours = Math.floor(sessionTime / 60);
  const minutes = sessionTime % 60;

  // Топ команд
  const topCommands = Object.entries(stats.commands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  let output = '';

  // Только команды
  if (commands) {
    output = `⚡ <b>Статистика команд:</b>\n\n`;
    topCommands.forEach(([cmd, count], index) => {
      const bar = chart ? '█'.repeat(Math.ceil(count / topCommands[0][1] * 10)) : '';
      output += `${index + 1}. ${cmd}: ${count}x ${bar}\n`;
    });
    return output;
  }

  // Только время
  if (time) {
    output = `⏱ <b>Временная статистика:</b>\n\n`;
    output += `Начало сессии: ${new Date(stats.startTime).toLocaleString('ru')}\n`;
    output += `Длительность: ${hours}ч ${minutes}мин\n`;
    output += `Сообщений в минуту: ${(stats.totalMessages / (sessionTime || 1)).toFixed(2)}\n`;
    output += `Команд в час: ${((Object.values(stats.commands).reduce((a, b) => a + b, 0)) / ((sessionTime || 1) / 60)).toFixed(1)}\n`;
    return output;
  }

  // Полная статистика
  output = `📊 <b>Статистика использования</b>\n\n`;
  output += `💬 <b>Сообщения:</b> ${stats.totalMessages}\n`;
  output += `🎤 <b>Голосовых:</b> ${stats.voiceMessages}\n`;
  output += `⚡ <b>Команд:</b> ${Object.keys(stats.commands).length}\n`;
  output += `⏱ <b>Время сессии:</b> ${hours}ч ${minutes}мин\n\n`;

  // Топ команд
  if (topCommands.length > 0) {
    output += `🏆 <b>Топ команд:</b>\n`;
    topCommands.slice(0, 5).forEach(([cmd, count], index) => {
      const bar = chart ? '█'.repeat(Math.ceil(count / topCommands[0][1] * 10)) : '';
      output += `${index + 1}. ${cmd}: ${count}x ${bar}\n`;
    });
    output += `\n`;
  }

  // Любимая команда
  if (topCommands[0]) {
    output += `💎 <b>Любимая команда:</b> ${topCommands[0][0]} (${topCommands[0][1]}x)\n\n`;
  }

  // Детальная статистика
  if (detailed) {
    const textMessages = stats.totalMessages - stats.voiceMessages;
    const voicePercent = stats.totalMessages > 0 
      ? ((stats.voiceMessages / stats.totalMessages) * 100).toFixed(1) 
      : 0;
    const avgPerHour = sessionTime > 0 
      ? (stats.totalMessages / (sessionTime / 60)).toFixed(1) 
      : 0;

    output += `📈 <b>Детальная статистика:</b>\n`;
    output += `Текстовых: ${textMessages}\n`;
    output += `Голосовых: ${stats.voiceMessages} (${voicePercent}%)\n`;
    output += `Среднее/час: ${avgPerHour}\n`;
    output += `Всего команд выполнено: ${Object.values(stats.commands).reduce((a, b) => a + b, 0)}\n\n`;
  }

  output += `<i>💡 Статистика сбрасывается при перезапуске бота</i>`;

  return output;
}

// Обработчик команды
if (text.startsWith('/stats')) {
  updateStats(userId, '/stats');
  
  const parsed = parseCommandOptions(text, 'stats');
  const options = parsed ? parsed.options : {};
  
  const statsText = getDetailedStats(userId, options);
  await sendMessage(chatId, statsText);
  
  return res.status(200).json({ ok: true });
}
```

---

## 🎯 ИТОГО

Полная реализация PRO версий всех 5 команд с:
- ✅ Парсинг опций из команды
- ✅ Множественные режимы работы
- ✅ Гибкая настройка
- ✅ Детальные подсказки
- ✅ Обработка ошибок
- ✅ Готовый к использованию код

**Время реализации:** 4-6 часов  
**Версия:** 4.2 PRO  
**Статус:** ✅ Готово к интеграции
