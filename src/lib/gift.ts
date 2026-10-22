import { GIFT, type Effect } from '@/config/gift';

const MMDD = /^(\d{2})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');
const mmdd = (d: Date) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Local calendar date at midnight, so day differences ignore the time of day. */
const midnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Today, or the `?day=MM-DD` preview date (current year, current time). */
export function today(search = window.location.search): Date {
  const now = new Date();
  const match = new URLSearchParams(search).get('day')?.match(MMDD);
  if (!match) return now;
  const preview = new Date(now);
  preview.setMonth(Number(match[1]) - 1, Number(match[2]));
  return preview;
}

export const dayKey = (d: Date) => `${d.getFullYear()}-${mmdd(d)}`;

function togetherDate(): Date | null {
  if (!GIFT.together) return null;
  const date = new Date(`${GIFT.together}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Days since GIFT.together, counting that first day as day 1. */
export function daysTogether(now: Date): number | null {
  const start = togetherDate();
  if (!start) return null;
  const days = Math.round((midnight(now).getTime() - midnight(start).getTime()) / DAY_MS) + 1;
  return days > 0 ? days : null;
}

const fill = (text: string, vars: Record<string, string | number>) =>
  text.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));

export interface Occasion {
  title: string;
  message: string;
  effect: Effect;
}

/** The special occasion for this date, if any (anniversary > birthday > fixed days). */
export function occasionOn(now: Date): Occasion | null {
  const key = mmdd(now);
  const start = togetherDate();
  const days = daysTogether(now) ?? 0;

  if (start && mmdd(start) === key && now.getFullYear() > start.getFullYear()) {
    const vars = { years: now.getFullYear() - start.getFullYear(), days, name: GIFT.name };
    return { title: fill(GIFT.anniversary.title, vars), message: fill(GIFT.anniversary.message, vars), effect: 'hearts' };
  }
  if (GIFT.birthday && GIFT.birthday === key) {
    const vars = { name: GIFT.name, days };
    return { title: fill(GIFT.birthdayGreeting.title, vars), message: fill(GIFT.birthdayGreeting.message, vars), effect: 'hearts' };
  }
  const fixed = GIFT.specialDays.find((d) => d.date === key);
  return fixed ? { title: fixed.title, message: fixed.message, effect: fixed.effect } : null;
}

/** A stable message per calendar day, so it doesn't change on every reload. */
export function dailyMessage(now: Date): string {
  const list = GIFT.dailyMessages;
  if (!list.length) return '';
  const dayOfYear = Math.floor((midnight(now).getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / DAY_MS);
  return list[dayOfYear % list.length];
}

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export function dayPart(now: Date): DayPart {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 18) return 'afternoon';
  if (h >= 18 && h < 23) return 'evening';
  return 'night';
}
