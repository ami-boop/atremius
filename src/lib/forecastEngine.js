import { getRecentDateKeys } from '@/lib/dateUtils';
import { buildBodyInsights } from '@/lib/bodyInsights';

const WEATHER_SENSITIVITY = 1.35;
const PRODUCTIVE_THRESHOLD = 68;
const STABLE_THRESHOLD = 45;

const NEUTRAL_METRICS = {
  sleep: 7,
  stress: 4,
  focus: 6,
  concentration: 6,
  activity: 90,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(value);
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
  return recent - previous;
}

function recentStreak(values, predicate) {
  let streak = 0;

  for (let index = values.length - 1; index >= 0; index -= 1) {
    if (!predicate(values[index])) break;
    streak += 1;
  }

  return streak;
}

function activityToSupportScore(minutes) {
  if (minutes >= 90 && minutes <= 160) return 10;
  if (minutes > 220) return 5;
  if (minutes > 160) return 9 - ((minutes - 160) / 60) * 3;
  if (minutes >= 60) return 8 + ((Math.min(minutes, 90) - 60) / 30) * 2;
  if (minutes >= 30) return 5 + ((minutes - 30) / 30) * 3;
  if (minutes >= 10) return 3 + ((minutes - 10) / 20) * 2;
  return 1;
}

function weatherTypeScore(code) {
  if (code === 0) return 11;
  if ([1].includes(code)) return 8;
  if ([2].includes(code)) return 4;
  if ([3].includes(code)) return -1;
  if ([45, 48].includes(code)) return -6;
  if ([51, 53, 55, 56, 57].includes(code)) return -7;
  if ([61, 63, 65, 66, 67].includes(code)) return -9;
  if ([80, 81, 82].includes(code)) return -10;
  if ([71, 73, 75, 77, 85, 86].includes(code)) return -8;
  if ([95, 96, 99].includes(code)) return -12;
  return -2;
}

function temperatureComfortScore(temp) {
  if (temp >= 18 && temp <= 24) return 4;
  if (temp >= 12 && temp < 18) return 2;
  if (temp >= 25 && temp <= 28) return 1;
  if (temp >= 6 && temp < 12) return -1;
  if (temp >= 0 && temp < 6) return -3;
  if (temp < 0) return -5;
  if (temp > 28 && temp <= 31) return -2;
  if (temp > 31) return -4;
  return 0;
}

function buildHistorySample(daysByDate, currentDateKey, windowSize, fillNeutral = false) {
  const dateKeys = getRecentDateKeys(currentDateKey, windowSize);
  const history = dateKeys
    .map((dateKey) => {
      const vitality = daysByDate[dateKey]?.vitality;
      if (!vitality) return null;

      return {
        dateKey,
        sleep: vitality.sleep ?? NEUTRAL_METRICS.sleep,
        stress: vitality.stress ?? NEUTRAL_METRICS.stress,
        focus: vitality.focus ?? NEUTRAL_METRICS.focus,
        concentration: vitality.concentration ?? vitality.focus ?? NEUTRAL_METRICS.concentration,
        activity: vitality.activity ?? NEUTRAL_METRICS.activity,
      };
    })
    .filter(Boolean);

  while (fillNeutral && history.length < windowSize) {
    history.unshift({
      dateKey: `synthetic-${history.length}`,
      ...NEUTRAL_METRICS,
    });
  }

  return history;
}

function buildMetricSnapshot(history) {
  const sleepValues = history.map((day) => day.sleep);
  const stressValues = history.map((day) => day.stress);
  const focusValues = history.map((day) => day.focus);
  const concentrationValues = history.map((day) => day.concentration);
  const activityValues = history.map((day) => day.activity);
  const activitySupportValues = activityValues.map(activityToSupportScore);

  const avgSleep = weightedAverage(sleepValues);
  const avgStress = weightedAverage(stressValues);
  const avgFocus = weightedAverage(focusValues);
  const avgConcentration = weightedAverage(concentrationValues);
  const avgActivitySupport = weightedAverage(activitySupportValues);

  const sleepTrend = metricTrend(sleepValues);
  const stressTrend = metricTrend(stressValues);
  const focusTrend = metricTrend(focusValues);
  const concentrationTrend = metricTrend(concentrationValues);
  const activityTrend = metricTrend(activityValues);

  const lowSleepStreak = recentStreak(sleepValues, (value) => value <= 5);
  const highStressStreak = recentStreak(stressValues, (value) => value >= 7);
  const lowActivityStreak = recentStreak(activityValues, (value) => value < 45);
  const lowFocusStreak = recentStreak(focusValues, (value) => value <= 4);
  const recentQualityWindow = history.slice(-4);
  const strongRecentDays = recentQualityWindow.filter(
    (day) => day.sleep >= 7.5 && day.stress <= 4.5 && day.focus >= 7 && day.concentration >= 7 && day.activity >= 60,
  ).length;
  const exceptionalRecentDays = recentQualityWindow.filter(
    (day) => day.sleep >= 8 && day.stress <= 4 && day.focus >= 7.5 && day.concentration >= 7.5 && day.activity >= 75,
  ).length;

  let readinessScore = 54;
  readinessScore += (avgSleep - 7) * 5.5;
  readinessScore -= (avgStress - 4) * 5.25;
  readinessScore += (avgFocus - 6) * 4.75;
  readinessScore += (avgConcentration - 6) * 3.25;
  readinessScore += (avgActivitySupport - 6) * 3;
  readinessScore += clamp(sleepTrend, -2, 2) * 3.5;
  readinessScore -= clamp(stressTrend, -2, 2) * 3.25;
  readinessScore += clamp(focusTrend, -2, 2) * 3;
  readinessScore += clamp(concentrationTrend, -2, 2) * 2;
  readinessScore += clamp(activityTrend, -90, 90) / 90 * 3.5;

  if (lowSleepStreak >= 2) readinessScore -= 6 + (lowSleepStreak - 2) * 3;
  if (highStressStreak >= 2) readinessScore -= 7 + (highStressStreak - 2) * 3;
  if (lowActivityStreak >= 3) readinessScore -= 5;
  if (lowFocusStreak >= 2) readinessScore -= 4;

  if (avgSleep >= 7.8 && avgStress <= 4.5 && avgFocus >= 7) readinessScore += 7;
  if (avgSleep >= 8.1 && avgStress <= 4 && avgFocus >= 7.3 && avgConcentration >= 7.2) readinessScore += 6;
  if (avgSleep <= 5.5 && avgStress >= 6.5) readinessScore -= 5;
  if (strongRecentDays >= 3) readinessScore += 5;
  if (exceptionalRecentDays >= 2) readinessScore += 4;

  return {
    history,
    averages: {
      sleep: avgSleep,
      stress: avgStress,
      focus: avgFocus,
      concentration: avgConcentration,
      activitySupport: avgActivitySupport,
    },
    trends: {
      sleep: sleepTrend,
      stress: stressTrend,
      focus: focusTrend,
      concentration: concentrationTrend,
      activity: activityTrend,
    },
    streaks: {
      lowSleep: lowSleepStreak,
      highStress: highStressStreak,
      lowActivity: lowActivityStreak,
      lowFocus: lowFocusStreak,
    },
    recentQuality: {
      strongRecentDays,
      exceptionalRecentDays,
      isStrong: strongRecentDays >= 3,
      isExceptional: exceptionalRecentDays >= 2,
    },
    readinessScore,
  };
}

function buildLongTermPattern(shortTerm, longTerm) {
  const sampleSize = longTerm.history.length;
  const confidence = clamp(sampleSize / 24, 0.25, 1);

  const deltas = {
    sleep: shortTerm.averages.sleep - longTerm.averages.sleep,
    stress: shortTerm.averages.stress - longTerm.averages.stress,
    focus: shortTerm.averages.focus - longTerm.averages.focus,
    concentration: shortTerm.averages.concentration - longTerm.averages.concentration,
    activitySupport: shortTerm.averages.activitySupport - longTerm.averages.activitySupport,
  };

  const chronic = {
    sleepDebt: longTerm.averages.sleep < 6.2,
    stressLoad: longTerm.averages.stress > 5.8,
    lowActivity: longTerm.averages.activitySupport < 5.8,
    stableHighFocus: longTerm.averages.focus > 6.8 && longTerm.averages.stress < 4.8,
  };

  return {
    sampleSize,
    confidence,
    deltas,
    chronic,
  };
}

function buildHistoryContext(daysByDate, currentDateKey) {
  const shortHistory = buildHistorySample(daysByDate, currentDateKey, 7, true);
  const longHistoryRaw = buildHistorySample(daysByDate, currentDateKey, 40, false);
  const longHistory = longHistoryRaw.length >= 10 ? longHistoryRaw : shortHistory;

  const shortTerm = buildMetricSnapshot(shortHistory);
  const longTerm = buildMetricSnapshot(longHistory);
  const patterns = buildLongTermPattern(shortTerm, longTerm);

  let readinessScore = shortTerm.readinessScore;

  if (patterns.deltas.sleep <= -0.6) readinessScore -= 4 * patterns.confidence;
  if (patterns.deltas.sleep >= 0.6) readinessScore += 2.5 * patterns.confidence;
  if (patterns.deltas.stress >= 0.7) readinessScore -= 5 * patterns.confidence;
  if (patterns.deltas.stress <= -0.7) readinessScore += 3 * patterns.confidence;
  if (patterns.deltas.focus >= 0.75) readinessScore += 4 * patterns.confidence;
  if (patterns.deltas.focus <= -0.75) readinessScore -= 4 * patterns.confidence;
  if (patterns.deltas.concentration <= -0.75) readinessScore -= 3 * patterns.confidence;
  if (patterns.deltas.activitySupport <= -0.8) readinessScore -= 3 * patterns.confidence;
  if (patterns.deltas.activitySupport >= 0.8) readinessScore += 2 * patterns.confidence;

  if (patterns.chronic.sleepDebt) readinessScore -= 4 * patterns.confidence;
  if (patterns.chronic.stressLoad) readinessScore -= 4 * patterns.confidence;
  if (patterns.chronic.lowActivity) readinessScore -= 2.5 * patterns.confidence;
  if (patterns.chronic.stableHighFocus) readinessScore += 3 * patterns.confidence;

  return {
    history: shortHistory,
    longHistory,
    averages: shortTerm.averages,
    trends: shortTerm.trends,
    streaks: shortTerm.streaks,
    recentQuality: shortTerm.recentQuality,
    longTermAverages: longTerm.averages,
    patterns,
    readinessScore: clamp(readinessScore, 22, 88),
  };
}

function buildWeatherContext(weatherDays) {
  const scoredDays = weatherDays.map((day) => {
    const conditionImpact = weatherTypeScore(day.weather_code);
    const temperatureImpact = temperatureComfortScore(day.weather_temp);

    return {
      ...day,
      conditionImpact,
      temperatureImpact,
      directImpact: (conditionImpact + temperatureImpact) * WEATHER_SENSITIVITY,
    };
  });

  const badWeatherDays = scoredDays.filter((day) => day.directImpact <= -6).length;
  const goodWeatherDays = scoredDays.filter((day) => day.directImpact >= 6).length;
  const weeklyBias = clamp((goodWeatherDays - badWeatherDays) * 1.4, -8, 6);

  return {
    days: scoredDays,
    badWeatherDays,
    goodWeatherDays,
    weeklyBias,
  };
}

function scoreToWorkMode(score) {
  if (score >= PRODUCTIVE_THRESHOLD) return 'ПРОДУКТИВНОСТЬ';
  if (score >= STABLE_THRESHOLD) return 'СТАБИЛЬНО';
  return 'ВОССТАНОВЛЕНИЕ';
}

function buildDayRecommendation({ day, score, workMode, weatherContext, historyContext, bodyInsights, dayIndex }) {
  const parts = [];

  if (workMode === 'ПРОДУКТИВНОСТЬ') {
    parts.push('Планируй глубокую работу на первую половину дня');
  } else if (workMode === 'СТАБИЛЬНО') {
    parts.push('Держи умеренный темп и оставь резерв под переключения');
  } else {
    parts.push('Снизь нагрузку и ставь только самые важные задачи');
  }

  if (historyContext.streaks.lowSleep >= 2) {
    parts.push('не растягивай вечер и дай себе больше сна');
  } else if (historyContext.streaks.highStress >= 2) {
    parts.push('закладывай короткие паузы и меньше контекстных переключений');
  } else if (historyContext.streaks.lowActivity >= 3) {
    parts.push('добавь прогулку или лёгкую активность');
  } else if (historyContext.recentQuality.isStrong) {
    parts.push('последние дни были сильными, используй этот импульс под самые важные задачи');
  }

  if (bodyInsights.summary.recentBurden > 1.8 && bodyInsights.topPoints[0]) {
    parts.push(`тело сейчас ограничивает запас, особенно через ${bodyInsights.topPoints[0].label.toLowerCase()}`);
  }

  if (day.conditionImpact <= -7 || weatherContext.badWeatherDays >= 4) {
    parts.push(dayIndex === 0 ? 'погода может заметно снизить тонус' : 'не опирайся только на мотивацию из-за тяжёлой погоды');
  } else if (day.conditionImpact >= 6) {
    parts.push('используй хорошую погоду как окно для сложных задач');
  }

  return parts.join('. ') + '.';
}

function buildWeeklyRecommendations(historyContext, weatherContext, forecastDays) {
  const recommendations = [];

  if (historyContext.streaks.lowSleep >= 2 || historyContext.averages.sleep < 6.4) {
    recommendations.push('Сон проседает несколько дней подряд. На этой неделе приоритезируй более ранний отбой и стабильное время сна.');
  }

  if (historyContext.streaks.highStress >= 2 || historyContext.averages.stress > 6) {
    recommendations.push('Стресс остаётся высоким. Сократи число параллельных задач и разбивай работу на короткие завершённые блоки.');
  }

  if (historyContext.streaks.lowActivity >= 3 || historyContext.averages.activitySupport < 5.8) {
    recommendations.push('Активности не хватает для устойчивой энергии. Добавь ежедневную прогулку или хотя бы 20–30 минут движения.');
  }

  if (historyContext.averages.focus < 5.8 || historyContext.trends.focus < -0.75) {
    recommendations.push('Фокус снижается. Ставь меньше задач на день и начинай с одного самого важного блока без отвлечений.');
  }

  if (historyContext.recentQuality.isExceptional) {
    recommendations.push('Последние дни по метрикам очень сильные. Используй ближайшие 1–2 дня для самых важных и сложных задач.');
  } else if (historyContext.recentQuality.isStrong) {
    recommendations.push('Последние дни устойчиво хорошие. В ближайшие дни можно планировать как минимум один глубокий продуктивный блок.');
  }

  if (historyContext.patterns.sampleSize >= 10) {
    if (historyContext.patterns.deltas.sleep <= -0.6) {
      recommendations.push('Последняя неделя по сну хуже твоего обычного 30–40-дневного паттерна. Не считай текущее состояние нормой и верни опорный режим.');
    }

    if (historyContext.patterns.deltas.stress >= 0.7) {
      recommendations.push('Стресс заметно выше твоего месячного фона. На ближайшие дни лучше снижать плотность расписания, а не пытаться продавить её силой.');
    }

    if (historyContext.patterns.deltas.activitySupport <= -0.8) {
      recommendations.push('Активность опустилась ниже твоей обычной нормы. Даже короткое ежедневное движение здесь важнее, чем ещё один рабочий блок.');
    }
  }

  if (weatherContext.badWeatherDays >= 4) {
    recommendations.push('Неделя погодочувствительная. Планируй запас по энергии, больше света в помещении и не перегружай дождливые дни.');
  } else if (weatherContext.goodWeatherDays >= 4) {
    recommendations.push('Неделя по погоде поддерживающая. Самые сложные когнитивные задачи лучше ставить на самые ясные дни.');
  }

  if (!recommendations.length) {
    const productiveDays = forecastDays.filter((day) => day.work_mode === 'ПРОДУКТИВНОСТЬ').length;
    recommendations.push(
      productiveDays >= 3
        ? 'Базовое состояние устойчивое. Можно планировать несколько глубоких рабочих блоков, но без перегруза подряд.'
        : 'Состояние в целом ровное. Поддерживай привычный ритм и не перегружай дни с более слабым прогнозом.',
    );
  }

  return recommendations.slice(0, 4);
}

function buildForecastComment(historyContext, weatherContext, location, bodyInsights) {
  const locationNote =
    location?.source === 'geolocation'
      ? 'Погода взята по текущей геолокации.'
      : location?.source === 'manual'
        ? `Погода взята вручную для ${location.name}.`
        : `Погода взята по ${location?.name ?? 'fallback-локации'}.`;

  const patternNotes = [];
  if (historyContext.patterns.sampleSize >= 10) {
    if (historyContext.patterns.deltas.sleep <= -0.6) patternNotes.push('сон ниже твоего длинного паттерна');
    if (historyContext.patterns.deltas.stress >= 0.7) patternNotes.push('стресс выше твоего длинного паттерна');
    if (historyContext.patterns.deltas.focus <= -0.75) patternNotes.push('фокус ниже твоего обычного уровня');
    if (historyContext.patterns.deltas.focus >= 0.75) patternNotes.push('фокус выше твоего обычного уровня');
    if (historyContext.patterns.deltas.activitySupport <= -0.8) patternNotes.push('активность ниже твоей обычной нормы');
  }

  const weatherNote =
    weatherContext.badWeatherDays >= 4
      ? 'На неделе много неблагоприятной погоды, поэтому прогноз сознательно занижен.'
      : weatherContext.goodWeatherDays >= 4
        ? 'На неделе много ясных дней, поэтому прогноз получает погодный бонус.'
        : 'Погода влияет умеренно и корректирует базовую готовность точечно.';

  const bodyNote =
    bodyInsights.summary.recentBurden > 1.8 && bodyInsights.topPoints[0]
      ? ` Тело тоже влияет на прогноз: сейчас перегружается ${bodyInsights.topPoints[0].label.toLowerCase()}.`
      : bodyInsights.summary.painStreak >= 2
        ? ' Повторяющаяся боль тоже снижает прогноз.'
        : '';

  const patternNote = patternNotes.length
    ? ` Сравнение с 30–40-дневным паттерном: ${patternNotes.join(', ')}.`
    : '';

  return `${locationNote} База прогноза: сон ${round(historyContext.averages.sleep)}/10, стресс ${round(historyContext.averages.stress)}/10, фокус ${round(historyContext.averages.focus)}/10, активность ${round(average(historyContext.history.map((day) => day.activity)))} мин.${patternNote}${bodyNote} ${weatherNote}`;
}

export function buildProductivityForecast({ daysByDate, currentDateKey, weatherForecast, location }) {
  const historyContext = buildHistoryContext(daysByDate, currentDateKey);
  const bodyInsights = buildBodyInsights(daysByDate, currentDateKey);
  const weatherContext = buildWeatherContext(weatherForecast.days ?? []);
  const forecastDays = [];
  let carryoverAdjustment = 0;
  let productiveStreak = 0;
  const readinessBase = clamp(historyContext.readinessScore - bodyInsights.readinessPenalty, 18, 88);

  weatherContext.days.slice(0, 7).forEach((day, index) => {
    const progressiveWeatherBias =
      weatherContext.weeklyBias +
      (weatherContext.badWeatherDays >= 4 ? -index * 0.45 : 0) +
      (weatherContext.goodWeatherDays >= 4 ? index * 0.25 : 0);

    let score = readinessBase + day.directImpact + progressiveWeatherBias + carryoverAdjustment;

    if (historyContext.recentQuality.isExceptional && index <= 1 && day.directImpact > -6) {
      score += index === 0 ? 10 : 7;
    } else if (historyContext.recentQuality.isStrong && index <= 1 && day.directImpact > -7) {
      score += index === 0 ? 7 : 5;
    }

    if (historyContext.streaks.lowSleep >= 3 && day.directImpact < 0) score -= 3;
    if (historyContext.streaks.highStress >= 3 && day.directImpact < 0) score -= 2;
    if (historyContext.averages.activitySupport < 5.5 && day.directImpact < -4) score -= 1.5;

    score = clamp(score, 18, 96);
    let workMode = scoreToWorkMode(score);

    if (workMode === 'ПРОДУКТИВНОСТЬ' && productiveStreak >= 4) {
      score = Math.min(score, PRODUCTIVE_THRESHOLD - 1);
      workMode = scoreToWorkMode(score);
    }

    forecastDays.push({
      ...day,
      focus_score: round(score),
      work_mode: workMode,
      recommendation: buildDayRecommendation({
        day,
        score,
        workMode,
        weatherContext,
        historyContext,
        bodyInsights,
        dayIndex: index,
      }),
      score_breakdown: {
        readiness: round(readinessBase),
        body_penalty: -round(bodyInsights.readinessPenalty),
        weather: round(day.directImpact),
        weekly_weather_bias: round(progressiveWeatherBias),
        carryover: round(carryoverAdjustment),
      },
    });

    productiveStreak = workMode === 'ПРОДУКТИВНОСТЬ' ? productiveStreak + 1 : 0;
    carryoverAdjustment = (score - readinessBase) * 0.2;
    if (workMode === 'ПРОДУКТИВНОСТЬ') carryoverAdjustment -= 1.5;
    if (workMode === 'ВОССТАНОВЛЕНИЕ') carryoverAdjustment += 1.5;
  });

  return {
    source: 'local-forecast-engine',
    generatedAt: new Date().toISOString(),
    location,
    days: forecastDays,
    recommendations: buildWeeklyRecommendations(historyContext, weatherContext, forecastDays),
    bodyRecommendations: bodyInsights.bodyRecommendations,
    activityRecommendations: bodyInsights.activityRecommendations,
    comment: buildForecastComment(historyContext, weatherContext, location, bodyInsights),
  };
}
