import type { SeriesNavigationData } from './series';

export const SERIES_NAVIGATION_SLOT: string;
export const SERIES_NAVIGATION_SELECTOR: string;
export function hasSeriesNavigationSlot(html: string): boolean;
export function replaceSeriesNavigationSlots(html: string, navigationHtml: string): string;
export function formatSeriesScheduledDate(value: string): string;
export function seriesTocRows(
  navigation?: SeriesNavigationData | null,
  currentPost?: { title: string },
): Array<
  | { type: 'episode'; episodeNumber: number; title: string; path: string | null; current: boolean }
  | { type: 'upcoming'; episodeNumber: number; scheduledAt: string }
>;
