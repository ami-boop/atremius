# Firestore Seed

Создай 2 документа в Firestore Console и вставь значения ниже как есть.

## `profile/app`

```json
{
  "activeDate": "2026-04-19",
  "timezone": "Europe/Saratov",
  "locale": "ru",
  "defaultMode": "СТАБИЛЬНО",
  "habits": [
    {
      "id": 1,
      "name": "Выпить 2л воды",
      "done": false,
      "emoji": "💧"
    },
    {
      "id": 2,
      "name": "Утренняя зарядка 10 мин",
      "done": true,
      "emoji": "🏃"
    },
    {
      "id": 3,
      "name": "Медитация 5 мин",
      "done": false,
      "emoji": "🧘"
    },
    {
      "id": 4,
      "name": "Прогулка на улице",
      "done": true,
      "emoji": "🌿"
    },
    {
      "id": 5,
      "name": "Без телефона до 9:00",
      "done": false,
      "emoji": "📵"
    }
  ],
  "strategicGoalTemplate": "Редизайн архитектуры дизайн-системы",
  "circadianAnchorTime": "23:30",
  "wakeTimeTarget": "08:00",
  "createdAt": "2026-04-19T00:00:00.000Z",
  "updatedAt": "2026-04-19T00:00:00.000Z"
}
```

## `days/2026-04-19`

```json
{
  "date": "2026-04-19",
  "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ",
  "strategicGoal": "Редизайн архитектуры дизайн-системы",
  "focusBlocks": [
    {
      "id": 1,
      "time": "09:00",
      "title": "Глубокая работа: Аудит компонентов",
      "duration": "90",
      "subtasks": [
        {
          "id": 1,
          "text": "Проверить иерархию карточных компонентов",
          "done": true
        },
        {
          "id": 2,
          "text": "Аудит использования цветовых токенов",
          "done": true
        },
        {
          "id": 3,
          "text": "Задокументировать несоответствия отступов",
          "done": false
        },
        {
          "id": 4,
          "text": "Создать PR для рефакторинга",
          "done": false
        }
      ]
    },
    {
      "id": 2,
      "time": "11:30",
      "title": "Рефакторинг логики взаимодействия",
      "duration": "60",
      "subtasks": [
        {
          "id": 1,
          "text": "Вынести утилиты анимаций",
          "done": false
        },
        {
          "id": 2,
          "text": "Унифицировать hover-переходы",
          "done": false
        }
      ]
    },
    {
      "id": 3,
      "time": "14:00",
      "title": "Документация дизайн-системы",
      "duration": "45",
      "subtasks": [
        {
          "id": 1,
          "text": "Написать таблицу токенов",
          "done": false
        }
      ]
    }
  ],
  "vitality": {
    "sleep": 7,
    "stress": 3,
    "focus": 8,
    "activity": 45,
    "social": 6
  },
  "vitalityComments": {
    "sleep": "",
    "stress": "",
    "focus": "",
    "activity": "",
    "social": ""
  },
  "physiology": {
    "head": {
      "status": null,
      "comment": ""
    },
    "neck": {
      "status": null,
      "comment": ""
    },
    "shoulder_l": {
      "status": null,
      "comment": ""
    },
    "shoulder_r": {
      "status": null,
      "comment": ""
    },
    "elbow_l": {
      "status": null,
      "comment": ""
    },
    "elbow_r": {
      "status": null,
      "comment": ""
    },
    "wrist_l": {
      "status": null,
      "comment": ""
    },
    "wrist_r": {
      "status": null,
      "comment": ""
    },
    "chest": {
      "status": null,
      "comment": ""
    },
    "belly": {
      "status": null,
      "comment": ""
    },
    "knee_l": {
      "status": null,
      "comment": ""
    },
    "knee_r": {
      "status": null,
      "comment": ""
    },
    "foot_l": {
      "status": null,
      "comment": ""
    },
    "foot_r": {
      "status": null,
      "comment": ""
    }
  },
  "momentumChart": {
    "focus": [
      {
        "label": "ПН",
        "value": 45,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ВТ",
        "value": 70,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СР",
        "value": 60,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ЧТ",
        "value": 85,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СГД",
        "value": 78,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СБ",
        "value": 0,
        "mode": null
      },
      {
        "label": "ВС",
        "value": 0,
        "mode": null
      }
    ],
    "stress": [
      {
        "label": "ПН",
        "value": 60,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ВТ",
        "value": 45,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "СР",
        "value": 75,
        "mode": "ВОССТАНОВЛЕНИЕ"
      },
      {
        "label": "ЧТ",
        "value": 30,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СГД",
        "value": 35,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СБ",
        "value": 0,
        "mode": null
      },
      {
        "label": "ВС",
        "value": 0,
        "mode": null
      }
    ]
  },
  "momentumChartAnalytics": {
    "focus": [
      {
        "label": "ПН",
        "value": 45,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ВТ",
        "value": 70,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СР",
        "value": 60,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ЧТ",
        "value": 85,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СГД",
        "value": 78,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СБ",
        "value": 0,
        "mode": null
      },
      {
        "label": "ВС",
        "value": 0,
        "mode": null
      }
    ],
    "stress": [
      {
        "label": "ПН",
        "value": 45,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ВТ",
        "value": 70,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СР",
        "value": 60,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ЧТ",
        "value": 85,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СГД",
        "value": 78,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СБ",
        "value": 0,
        "mode": null
      },
      {
        "label": "ВС",
        "value": 0,
        "mode": null
      }
    ],
    "social": [
      {
        "label": "ПН",
        "value": 5,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ВТ",
        "value": 7,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СР",
        "value": 6,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ЧТ",
        "value": 9,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СГД",
        "value": 8,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СБ",
        "value": 0,
        "mode": null
      },
      {
        "label": "ВС",
        "value": 0,
        "mode": null
      }
    ],
    "activity": [
      {
        "label": "ПН",
        "value": 135,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ВТ",
        "value": 210,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СР",
        "value": 180,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ЧТ",
        "value": 255,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СГД",
        "value": 234,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СБ",
        "value": 0,
        "mode": null
      },
      {
        "label": "ВС",
        "value": 0,
        "mode": null
      }
    ],
    "sleep": [
      {
        "label": "ПН",
        "value": 5,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ВТ",
        "value": 7,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СР",
        "value": 6,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ЧТ",
        "value": 9,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СГД",
        "value": 8,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СБ",
        "value": 0,
        "mode": null
      },
      {
        "label": "ВС",
        "value": 0,
        "mode": null
      }
    ],
    "concentration": [
      {
        "label": "ПН",
        "value": 5,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ВТ",
        "value": 7,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СР",
        "value": 6,
        "mode": "СТАБИЛЬНО"
      },
      {
        "label": "ЧТ",
        "value": 9,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СГД",
        "value": 8,
        "mode": "ВЫСОКАЯ ПРОДУКТИВНОСТЬ"
      },
      {
        "label": "СБ",
        "value": 0,
        "mode": null
      },
      {
        "label": "ВС",
        "value": 0,
        "mode": null
      }
    ]
  },
  "forecast": {
    "days": [
      {
        "focus_score": 62,
        "work_mode": "СТАБИЛЬНО",
        "weather_temp": 14,
        "weather_type": "облачно"
      },
      {
        "focus_score": 74,
        "work_mode": "ВЫСОКИЙ ПОТОК",
        "weather_temp": 16,
        "weather_type": "солнечно"
      },
      {
        "focus_score": 81,
        "work_mode": "ВЫСОКИЙ ПОТОК",
        "weather_temp": 18,
        "weather_type": "солнечно"
      },
      {
        "focus_score": 69,
        "work_mode": "СТАБИЛЬНО",
        "weather_temp": 15,
        "weather_type": "переменная облачность"
      },
      {
        "focus_score": 53,
        "work_mode": "СТАБИЛЬНО",
        "weather_temp": 13,
        "weather_type": "дождь"
      },
      {
        "focus_score": 39,
        "work_mode": "ВОССТАНОВЛЕНИЕ",
        "weather_temp": 12,
        "weather_type": "дождь"
      },
      {
        "focus_score": 47,
        "work_mode": "СТАБИЛЬНО",
        "weather_temp": 13,
        "weather_type": "облачно"
      }
    ],
    "comment": "Локальный прогноз включен, потому что Base44 клиент не настроен через переменные окружения."
  },
  "createdAt": "2026-04-19T00:00:00.000Z",
  "updatedAt": "2026-04-19T00:00:00.000Z"
}
```
