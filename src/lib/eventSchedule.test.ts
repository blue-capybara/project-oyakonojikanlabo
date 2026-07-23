import { describe, expect, it } from 'vitest';
import {
  compareEventSchedule,
  comparePicoEventSchedule,
  formatEventOccurrence,
  isEventScheduleReservable,
  normalizeEventScheduleStatus,
  type EventOccurrence,
  type SchedulableEvent,
} from './eventSchedule';

const occurrence = (date: string, startTime = '10:00:00'): EventOccurrence => ({
  date,
  startTime,
  endTime: '11:00:00',
  startsAt: `${date}T${startTime}+09:00`,
  endsAt: `${date}T11:00:00+09:00`,
  isAllDay: false,
  source: 'recurring',
});

describe('eventSchedule', () => {
  it('手動順位を優先し、未設定分を次回日・日程未定・開催中で並べる', () => {
    const events: SchedulableEvent[] = [
      {
        id: 'future-far',
        title: '未来・遠い',
        computedScheduleStatus: 'upcoming',
        nextOccurrence: occurrence('2026-09-01'),
      },
      {
        id: 'current',
        title: '開催中',
        computedScheduleStatus: 'current',
        currentOccurrence: occurrence('2026-07-23'),
      },
      {
        id: 'current-with-next',
        title: '開催中・次回あり',
        computedScheduleStatus: 'current',
        currentOccurrence: occurrence('2026-07-23'),
        nextOccurrence: occurrence('2026-07-30'),
      },
      {
        id: 'manual',
        title: '手動',
        computedScheduleStatus: 'current',
        currentOccurrence: occurrence('2026-07-23'),
        eventCpt: { picoDisplayOrder: 1 },
      },
      {
        id: 'undated',
        title: '日程未定',
        computedScheduleStatus: 'undated',
      },
      {
        id: 'future-near',
        title: '未来・近い',
        computedScheduleStatus: 'upcoming',
        nextOccurrence: occurrence('2026-08-01'),
      },
    ];

    expect(events.sort(comparePicoEventSchedule).map((event) => event.id)).toEqual([
      'manual',
      'current-with-next',
      'future-near',
      'future-far',
      'undated',
      'current',
    ]);
  });

  it('通常一覧では手動順位を無視して次回開催日の近い順にする', () => {
    const events: SchedulableEvent[] = [
      {
        id: 'far-manual',
        title: '遠い',
        computedScheduleStatus: 'upcoming',
        nextOccurrence: occurrence('2026-09-01'),
        eventCpt: { picoDisplayOrder: 1 },
      },
      {
        id: 'near',
        title: '近い',
        computedScheduleStatus: 'upcoming',
        nextOccurrence: occurrence('2026-08-01'),
      },
    ];

    expect(events.sort(compareEventSchedule).map((event) => event.id)).toEqual([
      'near',
      'far-manual',
    ]);
  });

  it('トップPICOでは手動順位を最優先し、未設定の開催中・今後を終了済みより上にする', () => {
    const events: SchedulableEvent[] = [
      {
        id: 'past-unset',
        title: '終了済み・未設定',
        computedScheduleStatus: 'past',
      },
      {
        id: 'active-unset',
        title: '開催中・今後・未設定',
        computedScheduleStatus: 'upcoming',
        nextOccurrence: occurrence('2026-08-01'),
      },
      {
        id: 'past-manual',
        title: '終了済み・手動1位',
        computedScheduleStatus: 'past',
        eventCpt: { picoDisplayOrder: 1 },
      },
    ];

    expect(events.sort(comparePicoEventSchedule).map((event) => event.id)).toEqual([
      'past-manual',
      'active-unset',
      'past-unset',
    ]);
  });

  it('日程未定は指定文言を返し、予約可能にしない', () => {
    expect(formatEventOccurrence(null).fullLabel).toBe('開催予定・日程調整中');
    expect(normalizeEventScheduleStatus('unknown')).toBe('undated');
    expect(
      isEventScheduleReservable({
        computedScheduleStatus: 'undated',
        reservationOccurrences: [],
      }),
    ).toBe(false);
  });

  it('予約候補がある開催予定だけを予約可能にする', () => {
    expect(
      isEventScheduleReservable({
        computedScheduleStatus: 'upcoming',
        nextOccurrence: occurrence('2026-08-01'),
        reservationOccurrences: [occurrence('2026-08-01')],
      }),
    ).toBe(true);
  });

  it('Asia/Tokyo基準の日付と時刻を表示する', () => {
    const formatted = formatEventOccurrence(occurrence('2026-07-25', '09:30:00'));
    expect(formatted.dateLabel).toContain('2026年7月25日');
    expect(formatted.timeLabel).toBe('09:30〜11:00');
  });
});
