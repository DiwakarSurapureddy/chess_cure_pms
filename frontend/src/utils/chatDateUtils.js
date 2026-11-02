/**
 * Utility functions for ChessCure chat date separators and timestamps
 */

/**
 * Robustly parses UTC timestamps from backend into a JavaScript Date object in local timezone.
 * Handles ISO strings with 'Z', offset strings, and legacy naive UTC strings.
 */
export const parseUtcDate = (d) => {
  if (!d) return null;
  if (d instanceof Date) return Number.isNaN(d.getTime()) ? null : d;
  const s = String(d).trim();
  if (!s) return null;
  const hasTz = s.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(s);
  const date = new Date(hasTz ? s : s + 'Z');
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Returns formatted date separator label based on calendar day difference in local timezone:
 * - Today: "Today"
 * - Previous day: "Yesterday"
 * - Earlier this week: Weekday name ("Monday", "Tuesday", etc.)
 * - Older (previous weeks or months): Complete date ("25 October 2026")
 */
export const getDateSeparatorLabel = (dateInput, referenceNow = new Date()) => {
  const date = parseUtcDate(dateInput);
  if (!date) return 'Today';

  const now = referenceNow instanceof Date ? referenceNow : new Date(referenceNow);

  // Normalize both dates to start of day in user's local timezone
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const msgStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

  const diffMs = todayStart.getTime() - msgStart.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }

  // Calculate start of current week (Monday at 00:00:00 local time)
  const currentDayOfWeek = (todayStart.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  const startOfWeek = new Date(todayStart);
  startOfWeek.setDate(todayStart.getDate() - currentDayOfWeek);

  // Earlier this week: within the current calendar week and within 6 days
  if (diffDays >= 2 && diffDays < 7 && msgStart.getTime() >= startOfWeek.getTime()) {
    return date.toLocaleDateString(undefined, { weekday: 'long' });
  }

  // Older messages (previous weeks or months): complete date e.g. "25 October 2026"
  const day = date.getDate();
  const monthName = date.toLocaleDateString('en-GB', { month: 'long' });
  const year = date.getFullYear();
  return `${day} ${monthName} ${year}`;
};

/**
 * Returns local date key (YYYY-MM-DD) for grouping
 */
export const getLocalDateKey = (dateInput) => {
  const date = parseUtcDate(dateInput);
  if (!date) return 'unknown';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

/**
 * Interleaves chronological message items with date separators when calendar date changes.
 */
export const groupMessagesWithSeparators = (messages = []) => {
  const items = [];
  let lastDateKey = null;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const rawDate = msg.createdAt || msg.created_at;
    const dateKey = getLocalDateKey(rawDate);

    if (dateKey !== lastDateKey) {
      items.push({
        type: 'date_separator',
        id: `date-sep-${dateKey}`,
        label: getDateSeparatorLabel(rawDate),
      });
      lastDateKey = dateKey;
    }

    items.push({
      type: 'message',
      id: msg.id || msg.clientMessageId || `msg-${i}`,
      data: msg,
    });
  }

  return items;
};

