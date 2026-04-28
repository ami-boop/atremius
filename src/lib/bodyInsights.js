import { bodyPointMeta } from '@/config/metrics';
import { getRecentDateKeys } from '@/lib/dateUtils';

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function scoreStatus(pointId, status) {
  if (!status || status === 'ok') return 0;

  const point = bodyPointMeta[pointId];
  if (!point) return 0;

  if (status === 'mild') return point.kind === 'muscle' ? 1.1 : 0.85;
  if (status === 'pain') return point.kind === 'muscle' ? 1.95 : 2.35;

  return 0;
}

function buildHistory(daysByDate, currentDateKey, count, currentPhysiology) {
  return getRecentDateKeys(currentDateKey, count).map((dateKey) => {
    const dayData = daysByDate[dateKey];
    const physiology = dateKey === currentDateKey && currentPhysiology
      ? currentPhysiology
      : dayData?.physiology ?? {};

    return {
      dateKey,
      physiology,
      activity: dayData?.vitality?.activity ?? 0,
    };
  });
}

function buildDayStrain(day) {
  let total = 0;
  let joint = 0;
  let muscle = 0;
  let painCount = 0;
  let mildCount = 0;

  Object.entries(day.physiology ?? {}).forEach(([pointId, value]) => {
    const status = value?.status ?? null;
    const point = bodyPointMeta[pointId];
    if (!point) return;

    const strain = scoreStatus(pointId, status);
    total += strain;
    if (point.kind === 'joint') joint += strain;
    if (point.kind === 'muscle') muscle += strain;
    if (status === 'pain') painCount += 1;
    if (status === 'mild') mildCount += 1;
  });

  return {
    total,
    joint,
    muscle,
    painCount,
    mildCount,
  };
}

function buildPointPressure(history) {
  const scores = {};

  history.forEach((day, dayIndex) => {
    const weight = dayIndex + 1;
    Object.entries(day.physiology ?? {}).forEach(([pointId, value]) => {
      const status = value?.status ?? null;
      const strain = scoreStatus(pointId, status);
      if (!strain) return;

      scores[pointId] = (scores[pointId] ?? 0) + strain * weight;
    });
  });

  return Object.entries(scores)
    .map(([pointId, score]) => ({
      pointId,
      score,
      ...bodyPointMeta[pointId],
    }))
    .sort((left, right) => right.score - left.score);
}

function buildRegionRecommendation(region, point) {
  if (region === 'posture') {
    return `Перегружается зона ${point.label.toLowerCase()}. Снизь статичную нагрузку, добавь микропаузу и мягкую мобилизацию плеч и шеи.`;
  }

  if (region === 'arms') {
    return `Есть сигнал по ${point.label.toLowerCase()}. Ослабь однотипную нагрузку на руки и делай короткие разгрузки для кистей и локтей.`;
  }

  if (region === 'legs') {
    return `Ноги получают сигнал через ${point.label.toLowerCase()}. На 1–2 дня снизь ударную нагрузку и оставь только лёгкую ходьбу или восстановительную активность.`;
  }

  if (region === 'core') {
    return `Зона ${point.label.toLowerCase()} перегружена. Не добивай корпус и оставь только лёгкую стабилизацию без тяжёлых усилий.`;
  }

  return `Обрати внимание на ${point.label.toLowerCase()} и не перегружай эту зону ближайшие дни.`;
}

export function buildBodyInsights(daysByDate, currentDateKey, currentPhysiology) {
  const recentHistory = buildHistory(daysByDate, currentDateKey, 7, currentPhysiology);
  const longHistory = buildHistory(daysByDate, currentDateKey, 21, currentPhysiology);

  const recentStrain = recentHistory.map(buildDayStrain);
  const longStrain = longHistory.map(buildDayStrain);
  const recentBurden = weightedAverage(recentStrain.map((day) => day.total));
  const longBurden = weightedAverage(longStrain.map((day) => day.total));
  const jointBurden = weightedAverage(recentStrain.map((day) => day.joint));
  const muscleBurden = weightedAverage(recentStrain.map((day) => day.muscle));
  const painStreak = recentStreak(recentStrain, (day) => day.painCount > 0);
  const muscleStreak = recentStreak(recentStrain, (day) => day.muscle > 0.9);
  const activityValues = recentHistory.map((day) => day.activity);
  const avgActivity = weightedAverage(activityValues);
  const activityTrend = metricTrend(activityValues);
  const topPoints = buildPointPressure(recentHistory).slice(0, 3);

  const bodyRecommendations = [];
  const activityRecommendations = [];

  if (recentBurden > 1.8) {
    bodyRecommendations.push('Тело за последние дни перегружено выше обычного. Ближайший план лучше строить с запасом на восстановление.');
  }

  if (recentBurden > longBurden + 0.8) {
    bodyRecommendations.push('Сигналы от тела сейчас сильнее твоего обычного фона. Не считай текущую нагрузку нормальной и не форсируй объём.');
  }

  if (painStreak >= 2) {
    bodyRecommendations.push('Боль повторяется несколько дней подряд. Лучше не повышать нагрузку, пока симптом не уйдёт хотя бы на 1–2 дня.');
  }

  if (muscleStreak >= 2 && muscleBurden > jointBurden) {
    bodyRecommendations.push('По мышцам видно накопленную слабость или утомление. Добавь больше восстановления и не добивай проблемные зоны.');
  }

  topPoints.forEach((point) => {
    if (point.score >= 4) {
      bodyRecommendations.push(buildRegionRecommendation(point.region, point));
    }
  });

  if (avgActivity < 45) {
    activityRecommendations.push('Активности в последние дни мало. Добавь ежедневную прогулку или 20–30 минут лёгкого движения, чтобы не проседала энергия.');
  } else if (avgActivity < 75 && recentBurden < 1.1) {
    activityRecommendations.push('Можно немного поднять общий уровень движения. Тебе пойдёт умеренная ежедневная активность без перегруза.');
  } else if (avgActivity > 170 && recentBurden > 1.4) {
    activityRecommendations.push('Активность высокая на фоне сигналов от тела. На ближайшие дни лучше сделать разгрузку, а не ещё поднимать объём.');
  } else if (activityTrend < -35 && recentBurden > 0.8) {
    activityRecommendations.push('Активность падает, а тело уже подаёт сигналы. Держи хотя бы лёгкую подвижность, но без тяжёлых нагрузок.');
  } else {
    activityRecommendations.push('По активности режим выглядит рабочим. Сохраняй ровное движение без резких скачков объёма.');
  }

  if (!bodyRecommendations.length) {
    bodyRecommendations.push('По телу сейчас нет выраженных красных флагов. Сохраняй ровную нагрузку и не делай резких скачков объёма.');
  }

  const readinessPenalty = clamp(
    recentBurden * 3 +
      Math.max(0, painStreak - 1) * 2.5 +
      Math.max(0, recentBurden - longBurden) * 2.2 +
      (avgActivity > 170 && recentBurden > 1.4 ? 2.5 : 0),
    0,
    18,
  );

  return {
    summary: {
      recentBurden,
      longBurden,
      jointBurden,
      muscleBurden,
      painStreak,
      avgActivity,
      activityTrend,
    },
    topPoints,
    bodyRecommendations: Array.from(new Set(bodyRecommendations)).slice(0, 3),
    activityRecommendations: Array.from(new Set(activityRecommendations)).slice(0, 2),
    readinessPenalty,
  };
}
