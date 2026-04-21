import { createClient } from '@base44/sdk'

const appId = import.meta.env.VITE_BASE44_APP_ID
const serverUrl = import.meta.env.VITE_BASE44_BACKEND_URL

function createMockForecast() {
  return {
    days: [
      { focus_score: 62, work_mode: 'СТАБИЛЬНО', weather_temp: 14, weather_type: 'облачно' },
      { focus_score: 74, work_mode: 'ВЫСОКИЙ ПОТОК', weather_temp: 16, weather_type: 'солнечно' },
      { focus_score: 81, work_mode: 'ВЫСОКИЙ ПОТОК', weather_temp: 18, weather_type: 'солнечно' },
      { focus_score: 69, work_mode: 'СТАБИЛЬНО', weather_temp: 15, weather_type: 'переменная облачность' },
      { focus_score: 53, work_mode: 'СТАБИЛЬНО', weather_temp: 13, weather_type: 'дождь' },
      { focus_score: 39, work_mode: 'ВОССТАНОВЛЕНИЕ', weather_temp: 12, weather_type: 'дождь' },
      { focus_score: 47, work_mode: 'СТАБИЛЬНО', weather_temp: 13, weather_type: 'облачно' },
    ],
    comment: 'Локальный прогноз включен, потому что Base44 клиент не настроен через переменные окружения.',
  }
}

function createFallbackClient() {
  return {
    auth: {
      async me() {
        throw new Error('Base44 client is not configured')
      },
    },
    integrations: {
      Core: {
        async InvokeLLM() {
          return createMockForecast()
        },
      },
    },
  }
}

export const base44 = appId
  ? createClient({
      appId,
      ...(serverUrl ? { serverUrl } : {}),
    })
  : createFallbackClient()
