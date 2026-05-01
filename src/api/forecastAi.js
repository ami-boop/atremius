import OpenAI from 'openai';
import { buildBodyInsights } from '@/lib/bodyInsights';
import { addDaysToDateKey, getForecastRunSlot, getRecentDateKeys } from '@/lib/dateUtils';
import { buildProductivityForecast as buildLocalForecast } from '@/lib/forecastEngine';
import { FORECAST_SYSTEM_PROMPT } from '@/prompts/forecastSystemPrompt';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1';
const PRIMARY_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free';
const FALLBACK_MODELS = ['nvidia/nemotron-3-nano-30b-a3b:free','openrouter/free'];
const ALLOWED_MODES = new Set(['ПРОДУКТИВНОСТЬ', 'СТАБИЛЬНО', 'ВОССТАНОВЛЕНИЕ']);
const HISTORY_SUMMARY_WINDOW = 40;
const RECENT_DETAIL_WINDOW = 7;
const FORECAST_MAX_TOKENS = 1500;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function weightedAverage(values) {
  if (!values.length) return 0;

  const weights = values.map((_, index) => index + 1);
  const weightedSum = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);

  return weightedSum / totalWeight;
}

function metricTrend(values) {
  if (values.length < 4) return 0;
  const recent = average(values.slice(-3));
  const previous = average(values.slice(0, -3));
  return Number((recent - previous).toFixed(2));
}

function extractPointStatuses(physiology) {
  return Object.entries(physiology ?? {})
    .filter(([, value]) => value?.status)
    .map(([pointId, value]) => ({
      pointId,
      status: value.status,
      comment: value.comment || '',
    }));
}

function summarizeHistoryDay(dateKey, dayData) {
  const vitality = dayData?.vitality ?? {};

  return {
    date: dateKey,
    mode: dayData?.mode ?? null,
    vitality: {
      sleep: vitality.sleep ?? null,
      stress: vitality.stress ?? null,
      focus: vitality.focus ?? null,
      concentration: vitality.concentration ?? vitality.focus ?? null,
      activity: vitality.activity ?? null,
      social: vitality.social ?? null,
    },
    bodySignals: extractPointStatuses(dayData?.physiology ?? {}),
  };
}

function buildMetricSummary(historyDays) {
  const sleep = historyDays.map((day) => day.vitality.sleep).filter((value) => typeof value === 'number');
  const stress = historyDays.map((day) => day.vitality.stress).filter((value) => typeof value === 'number');
  const focus = historyDays.map((day) => day.vitality.focus).filter((value) => typeof value === 'number');
  const concentration = historyDays.map((day) => day.vitality.concentration).filter((value) => typeof value === 'number');
  const activity = historyDays.map((day) => day.vitality.activity).filter((value) => typeof value === 'number');

  return {
    averages: {
      sleep: Number(weightedAverage(sleep).toFixed(2)),
      stress: Number(weightedAverage(stress).toFixed(2)),
      focus: Number(weightedAverage(focus).toFixed(2)),
      concentration: Number(weightedAverage(concentration).toFixed(2)),
      activity: Number(weightedAverage(activity).toFixed(2)),
    },
    trends: {
      sleep: metricTrend(sleep),
      stress: metricTrend(stress),
      focus: metricTrend(focus),
      concentration: metricTrend(concentration),
      activity: metricTrend(activity),
    },
  };
}

function buildModeDistribution(historyDays) {
  return historyDays.reduce(
    (distribution, day) => {
      if (day.mode && distribution[day.mode] !== undefined) {
        distribution[day.mode] += 1;
      }

      return distribution;
    },
    {
      ПРОДУКТИВНОСТЬ: 0,
      СТАБИЛЬНО: 0,
      ВОССТАНОВЛЕНИЕ: 0,
    },
  );
}

function buildForecastContext({ daysByDate, currentDateKey, weatherForecast, profile, slot }) {
  const includeToday = slot === 'evening';
  const historyEndDateKey = includeToday ? currentDateKey : addDaysToDateKey(currentDateKey, -1);
  const historyDateKeys = getRecentDateKeys(historyEndDateKey, HISTORY_SUMMARY_WINDOW);
  const historyDays = historyDateKeys
    .map((dateKey) => {
      const dayData = daysByDate[dateKey];
      if (!dayData) return null;
      return summarizeHistoryDay(dateKey, dayData);
    })
    .filter(Boolean);
  const recentHistoryDays = historyDays.slice(-RECENT_DETAIL_WINDOW);

  const bodyInsights = buildBodyInsights(daysByDate, historyEndDateKey);
  const metricSummary = buildMetricSummary(historyDays);

  // Long horizon goes in as summary, short horizon stays detailed so the model
  // still sees the freshest pattern without receiving the full 40-day raw dump.
  return {
    slot,
    includeToday,
    currentDateKey,
    historyEndDateKey,
    historyCoverageDays: historyDays.length,
    timezone: profile?.timezone ?? 'Europe/Saratov',
    weatherLocation: {
      id: weatherForecast.location?.id ?? null,
      name: weatherForecast.location?.name ?? null,
      source: weatherForecast.location?.source ?? null,
      timezone: weatherForecast.location?.timezone ?? null,
    },
    metricSummary,
    modeDistribution: buildModeDistribution(historyDays),
    bodySummary: {
      recentBurden: Number(bodyInsights.summary.recentBurden.toFixed(2)),
      longBurden: Number(bodyInsights.summary.longBurden.toFixed(2)),
      jointBurden: Number(bodyInsights.summary.jointBurden.toFixed(2)),
      muscleBurden: Number(bodyInsights.summary.muscleBurden.toFixed(2)),
      painStreak: bodyInsights.summary.painStreak,
      avgActivity: Number(bodyInsights.summary.avgActivity.toFixed(2)),
      activityTrend: Number(bodyInsights.summary.activityTrend.toFixed(2)),
      topPoints: bodyInsights.topPoints.map((point) => ({
        pointId: point.pointId,
        label: point.label,
        kind: point.kind,
        region: point.region,
        score: Number(point.score.toFixed(2)),
      })),
    },
    recentHistoryDays,
    weatherDays: weatherForecast.days.map((day) => ({
      date: day.date,
      weather_temp: day.weather_temp,
      weather_type: day.weather_type,
      weather_code: day.weather_code,
      weather_temp_min: day.weather_temp_min,
      weather_temp_max: day.weather_temp_max,
    })),
  };
}

function buildUserPrompt(context) {
  return JSON.stringify({
    task: 'Сформируй прогноз производительности на 7 дней и рекомендации по телу и активности.',
    constraints: {
      includeTodayInReasoning: context.includeToday,
      forecastSlot: context.slot,
      currentDateKey: context.currentDateKey,
      historyEndDateKey: context.historyEndDateKey,
      maxProductiveStreak: 4,
    },
    context,
  });
}

function extractJson(text) {
  if (!text) throw new Error('OpenRouter returned empty content');

  const fencedMatch = text.match(/```json\s*([\s\S]*?)```/i) ?? text.match(/```\s*([\s\S]*?)```/i);
  const raw = fencedMatch ? fencedMatch[1] : text;

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('OpenRouter returned non-JSON content');
  }

  return JSON.parse(raw.slice(start, end + 1));
}

function normalizeForecastResponse(aiResult, weatherForecast, meta) {
  const weatherDaysByDate = Object.fromEntries(weatherForecast.days.map((day) => [day.date, day]));
  const aiDays = Array.isArray(aiResult.days) ? aiResult.days : [];

  if (aiDays.length !== 7) {
    throw new Error(`AI returned ${aiDays.length} days instead of 7`);
  }

  const days = aiDays.map((aiDay, index) => {
    const weatherDay = weatherDaysByDate[aiDay.date] ?? weatherForecast.days[index];
    if (!weatherDay) {
      throw new Error(`AI day ${aiDay.date} has no matching weather day`);
    }

    const workMode = ALLOWED_MODES.has(aiDay.work_mode) ? aiDay.work_mode : 'СТАБИЛЬНО';

    return {
      ...weatherDay,
      date: weatherDay.date,
      focus_score: clamp(Math.round(Number(aiDay.focus_score) || 0), 18, 96),
      work_mode: workMode,
      recommendation: String(aiDay.recommendation || '').trim() || 'Держи умеренный темп и корректируй нагрузку по самочувствию.',
    };
  });

  return {
    source: 'openrouter-ai',
    generatedAt: new Date().toISOString(),
    forecastDateKey: meta.currentDateKey,
    slot: meta.slot,
    location: weatherForecast.location,
    weatherSource: weatherForecast.source,
    model: meta.model,
    days,
    recommendations: (Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [])
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 4),
    bodyRecommendations: (Array.isArray(aiResult.bodyRecommendations) ? aiResult.bodyRecommendations : [])
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 3),
    activityRecommendations: (Array.isArray(aiResult.activityRecommendations) ? aiResult.activityRecommendations : [])
      .map((item) => String(item).trim())
      .filter(Boolean)
      .slice(0, 2),
    comment: String(aiResult.comment || '').trim(),
  };
}

async function callModel({ model, apiKey, userPrompt }) {
  const client = new OpenAI({
    baseURL: OPENROUTER_URL,
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  let apiResponse;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      apiResponse = await client.chat.completions.create({
        model,
        temperature: 0.35,
        max_tokens: FORECAST_MAX_TOKENS,
        response_format: { type: "json_object" },
        messages: [
          {
            role: 'system',
            content: FORECAST_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
      break;
    } catch (err) {
      if (attempt === 2) throw err;
    }
  }

  console.log('RAW API RESPONSE:', JSON.stringify(apiResponse, null, 2));

  const message = apiResponse?.choices?.[0]?.message;

  let content =
    message?.content ||
    message?.tool_calls?.[0]?.function?.arguments ||
    '';

  if (!content) {
    throw new Error('OpenRouter returned empty content');
  }

  console.log('MODEL CONTENT:', content);

  return extractJson(content);
}

export async function generateProductivityForecast({ daysByDate, currentDateKey, weatherForecast, location, profile }) {
  const slot = getForecastRunSlot(profile?.timezone ?? 'Europe/Saratov');
  const context = buildForecastContext({ daysByDate, currentDateKey, weatherForecast, profile, slot });
  const userPrompt = buildUserPrompt(context);
  const apiKey = import.meta.env.VITE_OPEN_ROUTER_API_KEY;

  if (!apiKey) {
    const fallback = buildLocalForecast({ daysByDate, currentDateKey, weatherForecast, location });
    return {
      ...fallback,
      source: 'local-forecast-fallback',
      forecastDateKey: currentDateKey,
      slot,
      bodyRecommendations: fallback.bodyRecommendations ?? [],
      activityRecommendations: fallback.activityRecommendations ?? [],
      comment: `AI ключ не настроен. ${fallback.comment}`,
    };
  }

  const models = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError = null;

  for (const model of models) {
    try {
      const aiResult = await callModel({ model, apiKey, userPrompt });
      return normalizeForecastResponse(aiResult, weatherForecast, {
        currentDateKey,
        slot,
        model,
      });
    } catch (error) {
      console.error(`Forecast AI model failed: ${model}`, error);
      lastError = error;
    }
  }

  const fallback = buildLocalForecast({ daysByDate, currentDateKey, weatherForecast, location });
  return {
    ...fallback,
    source: 'local-forecast-fallback',
    forecastDateKey: currentDateKey,
    slot,
    bodyRecommendations: fallback.bodyRecommendations ?? [],
    activityRecommendations: fallback.activityRecommendations ?? [],
    comment: `AI прогноз недоступен, использован локальный fallback. ${fallback.comment}${lastError ? ` Ошибка: ${lastError.message}` : ''}`,
  };
}
