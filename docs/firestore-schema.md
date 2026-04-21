# Firestore Schema

Схема ниже собрана по текущему фронтенду и рассчитана на прямую интеграцию без лишней нормализации. Она адаптирована под личный single-user проект без Firebase Auth. Главная идея: почти все данные хранить в дневной записи, потому что UI крутится вокруг "сегодняшнего дня" и 7-дневной аналитики.

## Коллекции

### `profile/app`

Один документ с общими настройками приложения.

```json
{
  "timezone": "Europe/Saratov",
  "locale": "ru",
  "defaultMode": "СТАБИЛЬНО",
  "strategicGoalTemplate": "Редизайн архитектуры дизайн-системы",
  "circadianAnchorTime": "23:30",
  "wakeTimeTarget": "08:00",
  "activeDate": "2026-04-19",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp"
}
```

### `days/{dateKey}`

Основной документ дня. `dateKey` в формате `YYYY-MM-DD`, например `2026-04-19`.

```json
{
  "date": "2026-04-19",
  "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ",
  "strategicGoal": "Редизайн архитектуры дизайн-системы",
  "createdAt": "serverTimestamp",
  "updatedAt": "serverTimestamp",

  "focusProtocol": {
    "blocks": [
      {
        "id": "block_01",
        "order": 0,
        "time": "09:00",
        "title": "Глубокая работа: Аудит компонентов",
        "durationMin": 90,
        "subtasks": [
          {
            "id": "sub_01",
            "text": "Проверить иерархию карточных компонентов",
            "done": true
          }
        ]
      }
    ]
  },

  "habits": [
    {
      "id": "habit_01",
      "order": 0,
      "name": "Выпить 2л воды",
      "emoji": "💧",
      "done": false
    }
  ],

  "vitality": {
    "sleep": { "value": 7, "comment": "" },
    "stress": { "value": 3, "comment": "" },
    "focus": { "value": 8, "comment": "" },
    "activity": { "value": 45, "comment": "" },
    "social": { "value": 6, "comment": "" }
  },

  "physiology": {
    "head": { "status": null, "comment": "" },
    "neck": { "status": "ok", "comment": "" },
    "shoulder_l": { "status": "mild", "comment": "Чуть тянет" },
    "shoulder_r": { "status": null, "comment": "" },
    "elbow_l": { "status": null, "comment": "" },
    "elbow_r": { "status": null, "comment": "" },
    "wrist_l": { "status": null, "comment": "" },
    "wrist_r": { "status": null, "comment": "" },
    "chest": { "status": null, "comment": "" },
    "belly": { "status": null, "comment": "" },
    "knee_l": { "status": null, "comment": "" },
    "knee_r": { "status": null, "comment": "" },
    "foot_l": { "status": null, "comment": "" },
    "foot_r": { "status": null, "comment": "" }
  },

  "forecast": {
    "source": "firebase-ai",
    "model": "gemini-2.5-flash-lite",
    "generatedAt": "serverTimestamp",
    "comment": "Ожидается хороший пик в середине недели.",
    "days": [
      {
        "date": "2026-04-20",
        "focusScore": 72,
        "workMode": "ВЫСОКИЙ ПОТОК",
        "weatherTemp": 16,
        "weatherType": "солнечно"
      }
    ]
  }
}
```

## Почему именно так

### 1. Один документ на день

Это лучше всего совпадает с текущим UI:

- режим дня
- протокол фокуса
- привычки
- физиологический статус
- показатели жизненных сил
- AI-прогноз

Все эти данные уже воспринимаются фронтендом как состояние "на сегодня".

### 2. `focusProtocol.blocks` хранить массивом

В текущем фронте блоки:

- имеют порядок
- часто переставляются drag-and-drop
- редактируются целиком вместе с подзадачами

Поэтому массив объектов в одном дневном документе проще, чем отдельная подколлекция `focus_blocks`.

### 3. `habits` тоже массивом

Для текущего интерфейса привычки небольшие по объему и редактируются как список на один день. Нормализация в отдельную коллекцию пока только усложнит запись.

## Источник истины для аналитики

Для аналитики не советую хранить отдельный "ручной" `momentumChart` как основной источник данных.

Лучше строить графики из `days/{dateKey}`:

- `focus` брать из `vitality.focus.value`
- `stress` брать из `vitality.stress.value`
- `social` брать из `vitality.social.value`
- `activity` брать из `vitality.activity.value`
- `sleep` брать из `vitality.sleep.value`
- `mode` брать из `mode`

Причина: сейчас `MomentumChartAnalytics` хранит демонстрационные данные локально, но семантически это просто 7-дневная история дневных метрик. Значит лучше не дублировать их второй сущностью.

Единственное расхождение:

- в `MomentumChartAnalytics` есть `concentration`
- в `VitalityInput` уже есть `focus`

Рекомендация: оставить только `focus`, а `concentration` удалить или переименовать в тот же ключ, чтобы не плодить дубликаты.

## Допустимые значения

### `mode`

```txt
ВЫСОКАЯ ПРОДУКТИВНОСТЬ
СТАБИЛЬНО
ВОССТАНОВЛЕНИЕ
```

### `physiology.*.status`

```txt
null
ok
mild
pain
```

## Поля из фронтенда

### Протокол фокуса

Из текущего UI нужны:

- `time`
- `title`
- `durationMin`
- `subtasks[].text`
- `subtasks[].done`
- порядок блоков

### Привычки

Из текущего UI нужны:

- `name`
- `emoji`
- `done`
- порядок списка

### Показатели жизненных сил

Из текущего UI нужны:

- `sleep`
- `stress`
- `focus`
- `activity`
- `social`
- комментарий для каждой метрики

### Физиологический статус

Из текущего UI нужны точки:

- `head`
- `neck`
- `shoulder_l`
- `shoulder_r`
- `elbow_l`
- `elbow_r`
- `wrist_l`
- `wrist_r`
- `chest`
- `belly`
- `knee_l`
- `knee_r`
- `foot_l`
- `foot_r`

Для каждой:

- `status`
- `comment`

## Минимальный набор документов для старта

Чтобы начать интеграцию, достаточно создать:

1. `profile/app`
2. `days/{today}`

После этого фронт уже можно перевести на чтение/запись из Firestore.

## Что не нужно выносить в отдельные коллекции прямо сейчас

Пока не советую отдельно создавать:

- `focus_blocks`
- `habit_templates`
- `body_points`
- `analytics_snapshots`

Причина простая: текущий фронт маленький, а доступ к данным почти всегда идет в пределах одного дня. Лишняя нормализация только усложнит запросы и синхронизацию.

## Что можно добавить позже

Когда подключим Firestore, позже можно добавить:

- `habit_templates/{habitId}` для шаблонов привычек на каждый новый день
- `ai_logs/{logId}` для хранения истории AI-запросов
- `weekly_reviews/{weekKey}` для агрегированной аналитики

## Рекомендация по следующему шагу

Для интеграции я бы шёл так:

1. Читать/создавать `profile/app` и `days/{today}` при открытии дашборда.
2. Перевести `mode`, `focusProtocol`, `habits`, `vitality`, `physiology` на Firestore.
3. После этого подключить AI-прогноз в `forecast`.
