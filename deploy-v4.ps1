# Felix Bot v4.0 - Автоматический деплой
# Этот скрипт автоматизирует процесс деплоя

Write-Host "🚀 Felix Bot v4.0 - Автоматический деплой" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Шаг 1: Проверка Git статуса
Write-Host "📋 Шаг 1: Проверка изменений..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "✅ Найдены изменения для коммита:" -ForegroundColor Green
    git status --short
    Write-Host ""
} else {
    Write-Host "❌ Нет изменений для коммита" -ForegroundColor Red
    exit 1
}

# Шаг 2: Проверка ключевых файлов
Write-Host "📋 Шаг 2: Проверка ключевых файлов..." -ForegroundColor Yellow
$requiredFiles = @(
    "api/webhook.js",
    "miniapp/index.html",
    "package.json",
    "README.md"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file - НЕ НАЙДЕН!" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ Не все ключевые файлы найдены!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Шаг 3: Проверка содержимого webhook.js
Write-Host "📋 Шаг 3: Проверка команд в webhook.js..." -ForegroundColor Yellow
$webhookContent = Get-Content "api/webhook.js" -Raw
$commands = @("/summary", "/analyze", "/generate", "/organize", "/clear")
$allCommandsFound = $true

foreach ($cmd in $commands) {
    if ($webhookContent -match [regex]::Escape($cmd)) {
        Write-Host "  ✅ Команда $cmd найдена" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Команда $cmd НЕ НАЙДЕНА!" -ForegroundColor Red
        $allCommandsFound = $false
    }
}

if (-not $allCommandsFound) {
    Write-Host ""
    Write-Host "❌ Не все команды найдены в webhook.js!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Шаг 4: Добавление всех файлов
Write-Host "📋 Шаг 4: Добавление файлов в Git..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Файлы добавлены" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при добавлении файлов" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Шаг 5: Коммит
Write-Host "📋 Шаг 5: Создание коммита..." -ForegroundColor Yellow
$commitMessage = "Deploy Felix Bot v4.0 - Complete update with new commands"
git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Коммит создан: $commitMessage" -ForegroundColor Green
} else {
    Write-Host "⚠️ Возможно, нет изменений для коммита" -ForegroundColor Yellow
}
Write-Host ""

# Шаг 6: Push
Write-Host "📋 Шаг 6: Отправка на GitHub..." -ForegroundColor Yellow
Write-Host "⏳ Выполняется push..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push выполнен успешно!" -ForegroundColor Green
} else {
    Write-Host "❌ Ошибка при push" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Попробуйте выполнить push вручную через GitHub Desktop" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Шаг 7: Финальная информация
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 ДЕПЛОЙ ЗАВЕРШЕН!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Следующие шаги:" -ForegroundColor Yellow
Write-Host "  1. Откройте Vercel Dashboard" -ForegroundColor White
Write-Host "     https://vercel.com/dashboard" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Дождитесь завершения деплоя (~30 секунд)" -ForegroundColor White
Write-Host ""
Write-Host "  3. Протестируйте бота в Telegram" -ForegroundColor White
Write-Host "     https://t.me/fel12x_bot" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Проверьте команды:" -ForegroundColor White
Write-Host "     /start" -ForegroundColor Gray
Write-Host "     /summary" -ForegroundColor Gray
Write-Host "     /analyze Этот продукт отличный!" -ForegroundColor Gray
Write-Host "     /generate идеи для статьи" -ForegroundColor Gray
Write-Host "     /organize Купить молоко яйца хлеб" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. Откройте Mini App" -ForegroundColor White
Write-Host "     https://felix-black.vercel.app/miniapp/" -ForegroundColor Cyan
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "📚 Документация:" -ForegroundColor Yellow
Write-Host "  - ГОТОВО-К-ДЕПЛОЮ.md" -ForegroundColor White
Write-Host "  - ФИНАЛЬНЫЙ-ЧЕКЛИСТ.md" -ForegroundColor White
Write-Host "  - README.md" -ForegroundColor White
Write-Host ""
Write-Host "✨ Felix Bot v4.0 готов к работе!" -ForegroundColor Green
Write-Host ""
