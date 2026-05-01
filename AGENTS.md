# AGENTS.md

Практический справочник для LLM-агентов по проекту `life_system` (React + Vite + Tauri + Firestore).

Цель файла: дать быстрый и точный контекст, чтобы агент мог безопасно вносить изменения без долгого ресерча.

---

## 1) Что это за проект

- Single-user приложение для личной системы продуктивности и самочувствия.
- Основной UI: дашборд дня + вкладка аналитики.
- Бэкенд в текущей версии: Firestore напрямую из фронтенда (без собственного API).
- AI/прогноз производительности считается локально в браузере (на основе истории метрик + погоды OpenWeather/Open-Meteo + body insights).

---

## 2) Технологический стек

- Frontend: `React 18`, `react-router-dom`, `framer-motion`.
- Сборка: `Vite 6`.
- Desktop оболочка: `Tauri 2` (`src-tauri`).
- UI: `tailwindcss`, `radix-ui`, shadcn-style компоненты в `src/components/ui`.
- Хранилище: `firebase/firestore`.
- Графики: `recharts`.
- Линт: `eslint` (flat config).

Ключевые команды:

- `npm run dev` - фронтенд.
- `npm run tauri:dev` - desktop dev.
- `npm run build` / `npm run tauri:build`.
- `npm run lint`.

---

## 3) Точки входа и роутинг

- HTML entry: `index.html`.
- React bootstrap: `src/main.jsx`.
- Root app: `src/App.jsx`.
- Роуты:
  - `/` -> `src/pages/dashboard.jsx`
  - `*` -> `src/lib/PageNotFound.jsx`

Важно: переключение между "Дашборд" и "Аналитика" реализовано не роутером, а локальным state `activeTab` внутри `src/pages/dashboard.jsx`.

---

## 4) Карта `src` (по ответственности)

- `src/pages`
  - `dashboard.jsx` - главный orchestrator страницы, загрузка/сохранение Firestore, прокидывание данных в UI.
- `src/components/dashboard`
  - дневной workflow (focus blocks, habits, статус, навигация).
- `src/components/analytics`
  - ввод vitality/physiology, графики momentum, прогноз.
- `src/components/ui`
  - общие UI primitives.
- `src/lib`
  - бизнес-логика/утилиты (`forecastEngine`, `bodyInsights`, `analytics`, `dateUtils`, defaults).
- `src/api`
  - интеграции (`firebase.js`, `weather.js`).
- `src/config`
  - режимы, метрики, табы.
- `src/constants`
  - константы приложения.
- `src/hooks`
  - кастомные React hooks.

---

## 5) Глобальное состояние и data flow

### 5.1 Context

- `src/lib/ModeContext.jsx` хранит:
  - `mode`
  - `setMode`
  - `modeColor`

### 5.2 Главный источник правды страницы

В `src/pages/dashboard.jsx` живут:

- `profile` (`profile/app` в Firestore)
- `dateKey` (активная дата, обычно "сегодня" по timezone профиля)
- `dayData` (`days/{dateKey}`)
- `daysByDate` (последние ~40 дней для аналитики)
- `activeTab`
- `loading`

### 5.3 Загрузка

При монтировании dashboard:

1. Читается `profile/app`.
2. Вычисляется `todayDateKey` через `getTodayDateKey(profile.timezone)`.
3. Читается/создается `days/{todayDateKey}`.
4. Подтягиваются до 40 прошлых дней через query:
   - `where('date', '<=', todayDateKey)`
   - `orderBy('date', 'desc')`
   - `limit(40)`
5. Данные нормализуются через `mergeDayWithDefaults`.
6. `mode` в context синхронизируется с `dayData.mode`.

### 5.4 Сохранение

- `persistProfilePatch(patch)` -> `setDoc(profile/app, merge:true)`.
- `persistDayPatch(targetDateKey, patch)` -> `setDoc(days/{dateKey}, merge:true)`.
- Изменение режима (`mode`) из context автоматически уходит в day документ через `useEffect`.

---

## 6) Firestore: фактическая модель данных (как использует код)

## Коллекции

- `profile/app` (один документ)
- `days/{YYYY-MM-DD}` (документ дня)

## `profile/app` (реально используемые поля)

- `activeDate: string`
- `timezone: string`
- `locale: string`
- `defaultMode: string`
- `selectedWeatherLocation: string` (`auto` или id ручной локации)
- `weatherLocations: Array<{ id, name, latitude, longitude, timezone }>`
- `habits: Array<{ id, name, done, emoji }>`
- `strategicGoalTemplate: string`
- `circadianAnchorTime: string`
- `wakeTimeTarget: string`
- `createdAt: string`
- `updatedAt: string`

## `days/{dateKey}` (реально используемые поля)

- `date: YYYY-MM-DD`
- `mode: 'ПРОДУКТИВНОСТЬ' | 'СТАБИЛЬНО' | 'ВОССТАНОВЛЕНИЕ'`
- `strategicGoal: string`
- `focusBlocks: Array<{ id, time, title, duration, subtasks[] }>`
- `vitality: { sleep, stress, focus, activity, social }`
- `vitalityComments: { sleep, stress, focus, activity, social }`
- `physiology: { [pointId]: { status: null|'ok'|'mild'|'pain', comment: string } }`
- `momentumChart` (legacy/default fallback)
- `momentumChartAnalytics` (legacy/default fallback)
- `forecast: { days[], recommendations?, comment?, generatedAt?, ... }`
- `createdAt: string`
- `updatedAt: string`

Важно: текущий код хранит `vitality.*` как числа, а не `{ value, comment }`.

---

## 7) Firestore env vars и конфигурация

`src/api/firebase.js` ожидает:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Дополнительно для Vite/Tauri:

- `TAURI_DEV_HOST` (используется в `vite.config.js` для host/hmr).
- `VITE_OPEN_WEATHER_API_KEY` (опционально; используется для бесплатного OpenWeather 5 Day / 3 Hour Forecast API; если ключ отсутствует или OpenWeather недоступен, погода берется из Open-Meteo fallback).

---

## 8) Прогноз и аналитика (ключевые движки)

### 8.1 Momentum analytics

- Сборка 7-дневных серий: `src/lib/analytics.js` -> `buildMomentumChartAnalytics(daysByDate, currentDateKey)`.
- Источник значений:
  - `focus` <- `vitality.focus`
  - `stress` <- `vitality.stress`
  - `social` <- `vitality.social`
  - `activity` <- `vitality.activity`
  - `sleep` <- `vitality.sleep`
  - `concentration` <- `vitality.focus` (синоним в текущей реализации)

### 8.2 Body insights

- `src/lib/bodyInsights.js`:
  - анализ 7/21-дневной истории физиологии,
  - выделение перегруженных зон,
  - расчет `readinessPenalty`,
  - генерация кратких рекомендаций.

### 8.3 Forecast engine

- `src/lib/forecastEngine.js`:
  - объединяет history context + weather context + body insights.
  - режим по score:
    - `>= 68` -> `ПРОДУКТИВНОСТЬ`
    - `>= 45` -> `СТАБИЛЬНО`
    - иначе -> `ВОССТАНОВЛЕНИЕ`
  - формирует:
    - `days[]` с `focus_score`, `work_mode`, `recommendation`, `score_breakdown`
    - недельные recommendations
    - общий comment

### 8.4 Weather

- `src/api/weather.js`:
  - пытается взять геолокацию браузера;
  - fallback на ручные локации профиля (`kfar-tavor` / `saratov`);
  - сначала тянет прогноз из бесплатного OpenWeather 5 Day / 3 Hour Forecast API через `VITE_OPEN_WEATHER_API_KEY`;
  - агрегирует 3-часовые точки OpenWeather в дневные значения;
  - если ключ отсутствует или OpenWeather вернул ошибку, тянет 8 дней из Open-Meteo;
  - так как бесплатный OpenWeather дает до 5 дней, недостающие дни 7-дневного прогноза дополняются Open-Meteo;
  - использует дни 1..7 (без текущего дня) и нормализует оба провайдера в поля `weather_temp`, `weather_type`, `weather_code`.

---

## 9) UI-модули, которые чаще всего меняют

- `src/pages/dashboard.jsx` - data orchestration, Firestore IO, tab switch.
- `src/components/dashboard/DailyFocusProtocol.jsx` - управление фокус-блоками (edit/reorder/subtasks).
- `src/components/dashboard/HabitsTracker.jsx` - привычки.
- `src/components/analytics/VitalityInput.jsx` - метрики/комментарии.
- `src/components/dashboard/PhysiologicalStatus.jsx` - body points.
- `src/components/analytics/MomentumChartAnalytics.jsx` - графики.
- `src/components/analytics/ForecastChart.jsx` - генерация/перегенерация прогноза + выбор weather location.

---

## 10) Доменные константы и ограничения

- Режимы: `src/config/mode.js`
  - `ПРОДУКТИВНОСТЬ`
  - `СТАБИЛЬНО`
  - `ВОССТАНОВЛЕНИЕ`
- Ограничения focus blocks по режимам: `src/constants/index.js -> MODE_LIMITS`
  - продуктивность: до 4 блоков
  - стабильно: до 3 блоков
  - восстановление: до 2 блоков + max duration 30
- Метрики vitality/filters/body points: `src/config/metrics.js`.

---

## 11) Известные несоответствия и риски (не ломать молча)

1. Несогласованные mode labels в разных артефактах:
   - в приложении: `ПРОДУКТИВНОСТЬ`
   - в части docs/seed: `ВЫСОКАЯ ПРОДУКТИВНОСТЬ` или `ВЫСОКИЙ ПОТОК`

2. `docs/firestore-schema.md` частично устарел относительно реального кода:
   - описывает некоторые поля/структуры иначе (`focusProtocol`, `vitality.value`, и др.).

3. В `scripts/seed-firestore*.mjs` захардкожены Firebase credentials.
   - Не дублировать и не распространять секреты.
   - Для новых скриптов использовать env vars.

4. Нет Firebase Auth в runtime.
   - Логика рассчитана на single-user сценарий.

5. В коде есть исторические поля (`momentumChart`, `momentumChartAnalytics`) как fallback.
   - Перед удалением проверить, где реально читаются.

---

## 12) Правила для агентов при изменениях

1. Не менять shape Firestore документов без миграционного плана.
2. Если меняется `mode` vocabulary - синхронно обновлять:
   - `src/config/mode.js`
   - `src/lib/mocks.js`
   - `src/lib/forecastEngine.js`
   - seed-скрипты/документацию.
3. При правках аналитики проверять цепочку:
   - `daysByDate` -> `buildMomentumChartAnalytics` -> UI chart.
4. При правках прогноза проверять:
   - weather fallback,
   - генерацию `recommendations`,
   - сохранение прогноза в `days/{dateKey}.forecast`.
5. Не переусложнять архитектуру:
   - в проекте сознательно нет отдельного backend API.

---

## 13) Быстрый чеклист перед PR

- Приложение запускается (`npm run dev`).
- Нет ошибок линта (`npm run lint`).
- Проверены сценарии:
  - загрузка дашборда с пустым Firestore,
  - редактирование focus blocks/habits/vitality/physiology,
  - переключение mode,
  - генерация и сохранение forecast.
- Если трогали Firestore contract, обновлены:
  - `AGENTS.md`
  - `docs/firestore-schema.md` (если документ поддерживается актуальным).

---

## 14) Куда смотреть сначала (priority reading order)

1. `src/pages/dashboard.jsx`
2. `src/lib/mocks.js`
3. `src/lib/analytics.js`
4. `src/lib/forecastEngine.js`
5. `src/lib/bodyInsights.js`
6. `src/components/analytics/ForecastChart.jsx`
7. `src/api/weather.js`
8. `src/api/firebase.js`
9. `src/config/mode.js`
10. `src/config/metrics.js`

Если агент ограничен по контексту, сначала грузить именно эти файлы.
