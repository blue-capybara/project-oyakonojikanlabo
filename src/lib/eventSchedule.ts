export type EventScheduleStatus = 'upcoming' | 'current' | 'undated' | 'past';

export interface EventOccurrence {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  source: 'single' | 'recurring' | 'additional' | string;
}

export interface EventScheduleFields {
  computedScheduleStatus?: string | null;
  currentOccurrence?: EventOccurrence | null;
  nextOccurrence?: EventOccurrence | null;
  reservationOccurrences?: Array<EventOccurrence | null> | null;
}

export interface SchedulableEvent extends EventScheduleFields {
  id?: string | null;
  title?: string | null;
  eventCpt?: {
    picoDisplayOrder?: number | null;
  } | null;
}

export interface ScheduleDisplayParts {
  dateLabel: string;
  timeLabel: string;
  fullLabel: string;
  sortValue: number;
}

const DATE_FORMATTER = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  timeZone: 'Asia/Tokyo',
});

const VALID_STATUSES = new Set<EventScheduleStatus>(['upcoming', 'current', 'undated', 'past']);

export const normalizeEventScheduleStatus = (value?: string | null): EventScheduleStatus => {
  if (value && VALID_STATUSES.has(value as EventScheduleStatus)) {
    return value as EventScheduleStatus;
  }
  return 'undated';
};

export const compactOccurrences = (
  occurrences?: Array<EventOccurrence | null> | null,
): EventOccurrence[] =>
  (occurrences ?? []).filter((occurrence): occurrence is EventOccurrence =>
    Boolean(occurrence?.date),
  );

export const getDisplayOccurrence = (
  schedule?: EventScheduleFields | null,
): EventOccurrence | null =>
  schedule?.nextOccurrence ??
  schedule?.currentOccurrence ??
  compactOccurrences(schedule?.reservationOccurrences)[0] ??
  null;

const normalizeTime = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 5);
};

const parseOccurrenceDate = (occurrence: EventOccurrence) => {
  const date = new Date(`${occurrence.date}T12:00:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatEventOccurrence = (
  occurrence?: EventOccurrence | null,
  emptyLabel = '開催予定・日程調整中',
): ScheduleDisplayParts => {
  if (!occurrence) {
    return {
      dateLabel: emptyLabel,
      timeLabel: '',
      fullLabel: emptyLabel,
      sortValue: Number.POSITIVE_INFINITY,
    };
  }

  const parsedDate = parseOccurrenceDate(occurrence);
  const dateLabel = parsedDate ? DATE_FORMATTER.format(parsedDate) : occurrence.date;
  const startLabel = normalizeTime(occurrence.startTime);
  const endLabel = normalizeTime(occurrence.endTime);
  const timeLabel = startLabel
    ? `${startLabel}${endLabel ? `〜${endLabel}` : ''}`
    : endLabel
      ? `〜${endLabel}`
      : '';
  const startsAt = new Date(occurrence.startsAt).getTime();
  return {
    dateLabel,
    timeLabel,
    fullLabel: [dateLabel, timeLabel].filter(Boolean).join(' '),
    sortValue: Number.isNaN(startsAt) ? Number.POSITIVE_INFINITY : startsAt,
  };
};

export const isEventScheduleReservable = (schedule?: EventScheduleFields | null): boolean => {
  const status = normalizeEventScheduleStatus(schedule?.computedScheduleStatus);
  return (
    status !== 'undated' &&
    status !== 'past' &&
    compactOccurrences(schedule?.reservationOccurrences).length > 0
  );
};

const manualOrder = (event: SchedulableEvent) => {
  const value = event.eventCpt?.picoDisplayOrder;
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
};

const scheduleGroup = (event: SchedulableEvent) => {
  if (event.nextOccurrence) return 0;
  const status = normalizeEventScheduleStatus(event.computedScheduleStatus);
  if (status === 'undated') return 1;
  if (status === 'current') return 2;
  return 3;
};

const compareAutomaticSchedule = (
  left: SchedulableEvent,
  right: SchedulableEvent,
  futureDirection: 'asc' | 'desc' = 'asc',
) => {
  const groupComparison = scheduleGroup(left) - scheduleGroup(right);
  if (groupComparison !== 0) return groupComparison;

  const leftTime = left.nextOccurrence?.startsAt ?? left.currentOccurrence?.startsAt ?? '';
  const rightTime = right.nextOccurrence?.startsAt ?? right.currentOccurrence?.startsAt ?? '';
  const timeComparison = leftTime.localeCompare(rightTime);
  if (timeComparison !== 0) {
    return scheduleGroup(left) === 0 && futureDirection === 'desc'
      ? -timeComparison
      : timeComparison;
  }

  const titleComparison = (left.title ?? '').localeCompare(right.title ?? '', 'ja');
  if (titleComparison !== 0) return titleComparison;
  return (left.id ?? '').localeCompare(right.id ?? '');
};

/**
 * PICO専用。手動順位を優先し、未設定分を次回日・日程未定・開催中の順にします。
 */
export const comparePicoEventSchedule = (left: SchedulableEvent, right: SchedulableEvent) => {
  const leftOrder = manualOrder(left);
  const rightOrder = manualOrder(right);
  if (leftOrder !== null || rightOrder !== null) {
    if (leftOrder === null) return 1;
    if (rightOrder === null) return -1;
    if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  }
  return compareAutomaticSchedule(left, right);
};

/**
 * 通常一覧用。手動順位を参照せず、次回開催日の近い順にします。
 */
export const compareEventSchedule = (left: SchedulableEvent, right: SchedulableEvent) =>
  compareAutomaticSchedule(left, right);

/**
 * 通常一覧用。今後のイベントだけを遠い順にし、日程未定・開催中・終了の位置は維持します。
 */
export const compareEventScheduleDescending = (left: SchedulableEvent, right: SchedulableEvent) =>
  compareAutomaticSchedule(left, right, 'desc');

/**
 * PICO一覧用。開催中・今後を手動順位で並べ、終了イベントは手動順位を保持したまま後方へ送ります。
 */
export const comparePicoEventArchiveSchedule = (
  left: SchedulableEvent,
  right: SchedulableEvent,
) => {
  const leftIsPast = isPastEventSchedule(left);
  const rightIsPast = isPastEventSchedule(right);
  if (leftIsPast !== rightIsPast) return leftIsPast ? 1 : -1;
  return comparePicoEventSchedule(left, right);
};

export const isPastEventSchedule = (schedule?: EventScheduleFields | null) =>
  normalizeEventScheduleStatus(schedule?.computedScheduleStatus) === 'past';

export const EVENT_OCCURRENCE_GRAPHQL_FIELDS = `
  computedScheduleStatus
  currentOccurrence {
    date
    startTime
    endTime
    startsAt
    endsAt
    isAllDay
    source
  }
  nextOccurrence {
    date
    startTime
    endTime
    startsAt
    endsAt
    isAllDay
    source
  }
  reservationOccurrences {
    date
    startTime
    endTime
    startsAt
    endsAt
    isAllDay
    source
  }
`;
