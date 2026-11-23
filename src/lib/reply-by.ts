// "Aim to reply by <date>": two business days on, Monday to Friday, Melbourne time (site.replyTime).

const ZONE = 'Australia/Melbourne';
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** The calendar date in Melbourne for an instant, as UTC noon of that date (safe from DST edges). */
function melbourneDate(now: Date): Date {
  const parts = new Intl.DateTimeFormat('en-AU', { timeZone: ZONE, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return new Date(Date.UTC(get('year'), get('month') - 1, get('day'), 12));
}

/** The date `businessDays` working days after today in Melbourne, skipping Saturday and Sunday. */
export function aimToReplyBy(now: Date, businessDays = 2): Date {
  const d = melbourneDate(now);
  let left = businessDays;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d;
}

/** "Thursday 27 November" (Australian English, no comma, no year). */
export function formatReplyBy(d: Date): string {
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}
