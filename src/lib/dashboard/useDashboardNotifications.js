import { useEffect } from 'react';
import { getTodayDateKey } from '@/lib/dateUtils';

const FOCUS_NOTIFICATION_PREFIX = 'focus-block-ended';
const SLEEP_NOTIFICATION_PREFIX = 'sleep-reminder';
const SLEEP_REMINDER_LEAD_MINUTES = 30;
const NOTIFICATION_TICK_MS = 30000;

function parseTimeToMinutes(time) {
  if (!time || !time.includes(':')) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function getCurrentMinutes(timezone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hours = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minutes = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  return hours * 60 + minutes;
}

function wasAlreadySent(key) {
  return localStorage.getItem(key) === '1';
}

function markAsSent(key) {
  localStorage.setItem(key, '1');
}

async function showNotification(title, body) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  if (Notification.permission !== 'granted') return;

  new Notification(title, { body });
}

export async function triggerTestNotification() {
  await showNotification('Тест уведомлений', 'Если ты видишь это сообщение, уведомления работают корректно.');
}

export function useDashboardNotifications({ profile, dayData, dateKey }) {
  useEffect(() => {
    if (!profile || !dayData || !dateKey) return;

    const timezone = profile.timezone;

    const tick = async () => {
      const todayDateKey = getTodayDateKey(timezone);
      if (dateKey !== todayDateKey) return;

      const nowMinutes = getCurrentMinutes(timezone);

      for (const block of dayData.focusBlocks ?? []) {
        const startMinutes = parseTimeToMinutes(block.time);
        const durationMinutes = Number(block.duration);
        if (startMinutes === null || Number.isNaN(durationMinutes)) continue;

        const endMinutes = startMinutes + durationMinutes;
        if (nowMinutes < endMinutes) continue;

        const eventKey = `${FOCUS_NOTIFICATION_PREFIX}:${dateKey}:${block.id}:${endMinutes}`;
        if (wasAlreadySent(eventKey)) continue;

        await showNotification('Фокус-блок завершен', `Блок "${block.title}" закончился. Время сделать паузу или перейти к следующему шагу.`);
        markAsSent(eventKey);
      }

      const anchorMinutes = parseTimeToMinutes(profile.circadianAnchorTime);
      if (anchorMinutes === null) return;

      const reminderStartMinutes = anchorMinutes - SLEEP_REMINDER_LEAD_MINUTES;
      if (nowMinutes < reminderStartMinutes) return;
      if (nowMinutes > anchorMinutes) return;

      const sleepReminderKey = `${SLEEP_NOTIFICATION_PREFIX}:${dateKey}:${profile.circadianAnchorTime}`;
      if (wasAlreadySent(sleepReminderKey)) return;

      await showNotification(
        'Подготовка ко сну',
        `До циркадного якоря (${profile.circadianAnchorTime}) осталось около ${SLEEP_REMINDER_LEAD_MINUTES} минут.`,
      );
      markAsSent(sleepReminderKey);
    };

    void tick();
    const timer = setInterval(() => {
      void tick();
    }, NOTIFICATION_TICK_MS);

    return () => clearInterval(timer);
  }, [profile, dayData, dateKey]);
}
