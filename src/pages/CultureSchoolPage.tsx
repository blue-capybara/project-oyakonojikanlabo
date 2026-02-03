import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import { withBase } from '../utils/paths';

type CategoryKey = 'all' | 'reading' | 'art' | 'language' | 'wellness' | 'kids' | 'adult' | 'writing';
type WeeklyTimeBucket = 'morning' | 'afternoon' | 'evening';

interface CategoryFilter {
  key: CategoryKey;
  label: string;
}

interface GraphqlImageNode {
  sourceUrl?: string | null;
  altText?: string | null;
}

interface GraphqlImage {
  node?: GraphqlImageNode | null;
}

interface GraphqlSlot {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface GraphqlVenueNode {
  __typename?: string | null;
  title?: string | null;
  slug?: string | null;
}

interface GraphqlEventCpt {
  summary?: string | null;
  eventType?: string | null;
  price?: number | null;
  priceType?: string | null;
  capacity?: string | number | null;
  reservationOpen?: boolean | null;
  waitlistEnabled?: boolean | null;
  displayBadges?: (string | null)[] | null;
  mainImage?: GraphqlImage | null;
  singleSlots?: (GraphqlSlot | null)[] | null;
  venueRef?: {
    nodes?: (GraphqlVenueNode | null)[] | null;
  } | null;
  venueMapsUrl?: string | null;
  notes?: string | null;
}

interface GraphqlContact {
  phone?: string | null;
  email?: string | null;
  formUrl?: string | null;
  reservationOverrideUrl?: string | null;
}

interface GraphqlEventDetailExt {
  detailBody?: string | null;
  contact?: GraphqlContact | null;
}

interface GraphqlEventCategory {
  name?: string | null;
  slug?: string | null;
}

interface GraphqlRegionNode {
  name?: string | null;
}

interface GraphqlEventNode {
  id: string;
  slug?: string | null;
  title?: string | null;
  link?: string | null;
  eventCpt?: GraphqlEventCpt | null;
  eventDetailExt?: GraphqlEventDetailExt | null;
  eventCategories?: {
    nodes?: (GraphqlEventCategory | null)[] | null;
  } | null;
  eventRegions?: {
    nodes?: (GraphqlRegionNode | null)[] | null;
  } | null;
}

interface SchoolEventsResponse {
  events?: {
    nodes?: (GraphqlEventNode | null)[] | null;
    pageInfo: {
      hasNextPage: boolean;
      endCursor?: string | null;
    };
  } | null;
}

interface NormalizedSlot {
  isoDate: string;
  date: Date;
  weekday: number;
  dateLabel: string;
  startTimeLabel?: string;
  endTimeLabel?: string;
  timeRangeLabel?: string;
}

interface SchoolEventDisplay {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  image: string;
  scheduleLabel: string;
  scheduleDateLabel: string;
  scheduleTimeLabel?: string;
  statusLabel: string;
  statusClassName: string;
  categoryTags: CategoryKey[];
  locationLabel: string;
  priceLabel: string;
  capacityLabel: string;
  detailUrl: string;
  reservationUrl?: string;
  slots: NormalizedSlot[];
  sortOrder: number;
}

interface CalendarEventItem {
  event: SchoolEventDisplay;
  slot: NormalizedSlot;
}

interface CalendarDay {
  isoDate: string;
  date: Date;
  label: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEventItem[];
}

interface CalendarPopupState {
  dateLabel: string;
  events: CalendarEventItem[];
}

type WeeklySchedule = Record<WeeklyTimeBucket, Record<number, CalendarEventItem[]>>;

const GRAPHQL_ENDPOINT = 'https://cms.oyakonojikanlabo.jp/graphql';
const EVENTS_PER_PAGE = 12;
const EVENT_IMAGE_FALLBACK = withBase('images/readdy/30e5f268453d5644679393e8b3b473c7.jpeg');

const CATEGORY_FILTERS: CategoryFilter[] = [
  { key: 'all', label: 'すべて' },
  { key: 'reading', label: '読書・朗読' },
  { key: 'art', label: 'アート・クラフト' },
  { key: 'language', label: '語学' },
  { key: 'wellness', label: 'ウェルネス' },
  { key: 'kids', label: 'キッズ' },
  { key: 'adult', label: '大人向け' },
  { key: 'writing', label: '文章・表現' },
];

const FAQ_ITEMS = [
  {
    question: '途中からの入会はできますか？',
    answer:
      'はい、大丈夫です。定員に空きがあれば、途中からのご参加もできます。ただ、講座の内容によっては「前回までの流れ」がある場合もありますので、気になる方は、スタッフにひと声かけてみてくださいね。',
  },
  {
    question: '講座を休んだ場合、振替受講はできますか？',
    answer:
      '基本的には「振替」は行っていません。でも、同じ講座が別の曜日や時間に開かれていて、そこに空きがあれば、ご案内できることもあります。ご希望の方は、事前にご相談ください。',
  },
  {
    question: '子どもの講座に、親がいっしょについて行ってもいいですか？',
    answer:
      '基本的には「子どもがひとりでできる時間」を大事にしたいので、保護者の方にはお待ちいただく形になります。ただし、初回に限って見学OKの講座もあります。あと、3歳以下のお子さんについては、講座によって保護者の同伴をお願いすることがあります。詳しくは、講座のご案内をご覧ください。',
  },
  {
    question: '途中でやめることはできますか？',
    answer:
      'はい、できます。月謝制の講座は、やめたい月の「前月の20日」までにご連絡をいただければ大丈夫です。ただ、すでにお支払いいただいた月謝は返金できません。単発の講座については、開講日の7日前までなら全額返金、3日前までなら50％の返金、それ以降は返金が難しくなります。ご理解いただけたらうれしいです。',
  },
  {
    question: '教材費は別途必要ですか？',
    answer: '講座によって材料費が別途かかります。詳しいことは、それぞれの講座案内でご確認くださいね。',
  },
  {
    question: '初心者でも参加できますか？',
    answer:
      'もちろんです！はじめての方も、ウェルカムです。講師の方が丁寧に教えてくれますので、ご安心ください。「ちょっと不安だなぁ…」という方は、体験レッスンからスタートするのもおすすめです。',
  },
];

const INSTAGRAM_POSTS = [
  { id: 1, image: withBase('images/readdy/seq311-squarish-a-cozy-reading-corner-in-a.jpg'), likes: 245, comments: 18, alt: 'Reading Corner' },
  { id: 2, image: withBase('images/readdy/seq312-squarish-children-engaged-in-a-creative-art.jpg'), likes: 189, comments: 12, alt: 'Art Workshop' },
  { id: 3, image: withBase('images/readdy/seq313-squarish-a-storytelling-session-with-an-animated.jpg'), likes: 312, comments: 24, alt: 'Storytelling' },
  { id: 4, image: withBase('images/readdy/seq314-squarish-parents-and-children-participating-in-a.jpg'), likes: 278, comments: 21, alt: 'Family Workshop' },
  { id: 5, image: withBase('images/readdy/seq315-squarish-a-display-of-handmade-picture-books.jpg'), likes: 156, comments: 9, alt: 'Student Works' },
  { id: 6, image: withBase('images/readdy/seq316-squarish-an-adult-art-class-in-progress.jpg'), likes: 203, comments: 15, alt: 'Adult Class' },
  { id: 7, image: withBase('images/readdy/seq317-squarish-a-special-event-or-workshop-setup.jpg'), likes: 167, comments: 11, alt: 'Event Setup' },
  { id: 8, image: withBase('images/readdy/seq318-squarish-children-proudly-displaying-their-completed-art.jpg'), likes: 289, comments: 23, alt: 'Children\'s Art' },
  { id: 9, image: withBase('images/readdy/seq319-squarish-a-cozy-corner-of-the-facility.jpg'), likes: 198, comments: 14, alt: 'New Materials' },
];

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const WEEKDAY_TABLE_ORDER = [1, 2, 3, 4, 5, 6, 0];

const TIME_BUCKETS: { key: WeeklyTimeBucket; label: string; rangeLabel: string }[] = [
  { key: 'morning', label: '午前', rangeLabel: '10:00-12:00' },
  { key: 'afternoon', label: '午後', rangeLabel: '13:00-17:00' },
  { key: 'evening', label: '夜間', rangeLabel: '18:00-21:00' },
];

const STATUS_BADGES: Record<'current' | 'upcoming' | 'past', { label: string; className: string }> = {
  current: { label: '開催中', className: 'bg-sky-100 text-sky-800' },
  upcoming: { label: '受付中', className: 'bg-emerald-100 text-emerald-800' },
  past: { label: '終了', className: 'bg-gray-100 text-gray-600' },
};

const DISPLAY_BADGE_MAP: Record<string, { label: string; className: string }> = {
  open: { label: '予約受付中', className: 'bg-emerald-100 text-emerald-800' },
  few: { label: '残席わずか', className: 'bg-amber-100 text-amber-800' },
  wait: { label: 'キャンセル待ち', className: 'bg-orange-100 text-orange-800' },
  full: { label: '満席', className: 'bg-gray-200 text-gray-700' },
  closed: { label: '受付終了', className: 'bg-gray-200 text-gray-600' },
};

const CATEGORY_SLUG_MAP: Record<string, CategoryKey> = {
  reading: 'reading',
  'culture-reading': 'reading',
  art: 'art',
  craft: 'art',
  language: 'language',
  english: 'language',
  wellness: 'wellness',
  yoga: 'wellness',
  kids: 'kids',
  children: 'kids',
  adult: 'adult',
  writing: 'writing',
};

const CATEGORY_KEYWORDS: { key: CategoryKey; patterns: RegExp[] }[] = [
  { key: 'reading', patterns: [/読書/, /読み聞かせ/, /book/i] },
  { key: 'art', patterns: [/アート/, /絵/, /イラスト/, /art/i] },
  { key: 'language', patterns: [/英語/, /語学/, /language/i] },
  { key: 'wellness', patterns: [/ヨガ/, /ストレッチ/, /wellness/i, /health/i] },
  { key: 'kids', patterns: [/キッズ/, /子ども/, /親子/] },
  { key: 'adult', patterns: [/大人/, /adult/i] },
  { key: 'writing', patterns: [/文章/, /ストーリー/, /story/i] },
];

const monthFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  timeZone: 'Asia/Tokyo',
});

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'short',
  timeZone: 'Asia/Tokyo',
});

const GET_SCHOOL_EVENTS = gql`
  query GetSchoolEvents($first: Int!, $after: String) {
    events(first: $first, after: $after, where: { orderby: { field: DATE, order: DESC } }) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        slug
        title
        link
        eventCpt {
          summary
          eventType
          price
          priceType
          capacity
          reservationOpen
          waitlistEnabled
          displayBadges
          venueMapsUrl
          notes
          mainImage {
            node {
              sourceUrl
              altText
            }
          }
          singleSlots {
            date
            startTime
            endTime
          }
          venueRef {
            nodes {
              __typename
              ... on Space {
                title
                slug
              }
              ... on Page {
                title
              }
              ... on Post {
                title
              }
            }
          }
        }
        eventDetailExt {
          detailBody
          contact {
            phone
            email
            formUrl
            reservationOverrideUrl
          }
        }
        eventCategories {
          nodes {
            name
            slug
          }
        }
        eventRegions {
          nodes {
            name
          }
        }
      }
    }
  }
`;

const stripHtml = (html?: string | null) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
};

const truncateText = (text: string, limit = 100) => {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
};

const normalizeEventType = (value?: string | null) => {
  if (!value) return 'event';
  const normalized = value.toLowerCase();
  if (normalized.includes('school') || value.includes('スクール')) {
    return 'school';
  }
  return 'event';
};

const createIsoDate = (value?: string | null) => {
  if (!value) return null;
  const datePart = value.split('T')[0];
  if (!datePart || datePart.length !== 10) {
    return null;
  }
  return datePart;
};

const createDateFromIso = (iso: string) => {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    return null;
  }
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

const formatTimeLabel = (time?: string | null) => {
  if (!time) return undefined;
  const [hour, minute] = time.split(':');
  if (!hour) return undefined;
  const normalizedHour = hour.padStart(2, '0');
  const normalizedMinute = (minute ?? '00').padStart(2, '0');
  return `${normalizedHour}:${normalizedMinute}`;
};

const buildSlots = (slots?: (GraphqlSlot | null)[] | null): NormalizedSlot[] => {
  if (!slots) return [];
  const normalized = slots
    .map((slot) => {
      const isoDate = createIsoDate(slot?.date);
      if (!isoDate) return null;
      const date = createDateFromIso(isoDate);
      if (!date) return null;
      const startTimeLabel = formatTimeLabel(slot?.startTime);
      const endTimeLabel = formatTimeLabel(slot?.endTime);
      const timeRangeLabel = startTimeLabel
        ? endTimeLabel
          ? `${startTimeLabel}〜${endTimeLabel}`
          : `${startTimeLabel}〜`
        : endTimeLabel
        ? `〜${endTimeLabel}`
        : undefined;
      return {
        isoDate,
        date,
        weekday: date.getUTCDay(),
        dateLabel: dateFormatter.format(date),
        startTimeLabel,
        endTimeLabel,
        timeRangeLabel,
      };
    })
    .filter((slot): slot is NormalizedSlot => Boolean(slot));
  return normalized.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const buildScheduleParts = (slot?: NormalizedSlot) => {
  if (!slot) {
    return {
      dateLabel: '日程調整中',
      timeLabel: '',
      fullLabel: '日程調整中',
      sortOrder: Number.MIN_SAFE_INTEGER,
    };
  }
  const dateLabel = slot.dateLabel;
  const timeLabel = slot.timeRangeLabel ?? slot.startTimeLabel ?? '';
  const fullLabel = timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
  return {
    dateLabel,
    timeLabel,
    fullLabel,
    sortOrder: slot.date.getTime(),
  };
};

const formatPriceLabel = (price?: number | null, priceType?: string | null) => {
  if (priceType === 'free' || price === 0) {
    return '参加費：無料';
  }
  if (typeof price === 'number' && Number.isFinite(price)) {
    return `参加費：¥${price.toLocaleString()}`;
  }
  return '参加費：詳細は各スクールページをご確認ください';
};

const formatCapacityLabel = (capacity?: string | number | null) => {
  if (typeof capacity === 'number' && Number.isFinite(capacity)) {
    return `定員：${capacity}名`;
  }
  if (typeof capacity === 'string' && capacity.trim().length > 0) {
    return `定員：${capacity}`;
  }
  return '定員：お問い合わせください';
};

const buildLocationLabel = (eventCpt?: GraphqlEventCpt | null, regions?: GraphqlEventNode['eventRegions']) => {
  const venueNames = eventCpt?.venueRef?.nodes
    ?.map((node) => node?.title)
    .filter((title): title is string => Boolean(title));
  if (venueNames && venueNames.length > 0) {
    return venueNames.join('・');
  }
  const regionNames = regions?.nodes?.map((node) => node?.name).filter((name): name is string => Boolean(name));
  if (regionNames && regionNames.length > 0) {
    return regionNames.join('・');
  }
  return '開催場所：お問い合わせください';
};

const deriveStatusBadge = (eventCpt: GraphqlEventCpt | null | undefined, slot?: NormalizedSlot) => {
  if (eventCpt?.displayBadges) {
    const matched = eventCpt.displayBadges.find((badge): badge is keyof typeof DISPLAY_BADGE_MAP =>
      typeof badge === 'string' && DISPLAY_BADGE_MAP[badge],
    );
    if (matched) {
      return DISPLAY_BADGE_MAP[matched];
    }
  }
  if (eventCpt?.reservationOpen === false) {
    return DISPLAY_BADGE_MAP.closed;
  }
  if (eventCpt?.waitlistEnabled) {
    return DISPLAY_BADGE_MAP.wait;
  }
  if (!slot) {
    return STATUS_BADGES.upcoming;
  }
  const now = Date.now();
  if (slot.date.getTime() < now) {
    return STATUS_BADGES.past;
  }
  return STATUS_BADGES.upcoming;
};

const deriveCategoryTags = (node: GraphqlEventNode, slots: NormalizedSlot[]): CategoryKey[] => {
  const slugs = node.eventCategories?.nodes?.map((cat) => cat?.slug)?.filter((slug): slug is string => Boolean(slug)) ?? [];
  const mappedFromSlugs = slugs
    .map((slug) => CATEGORY_SLUG_MAP[slug])
    .filter((key): key is CategoryKey => Boolean(key));

  const baseTitle = `${node.title ?? ''} ${node.eventCpt?.summary ?? ''} ${node.eventDetailExt?.detailBody ?? ''}`;
  const fromKeywords = CATEGORY_KEYWORDS.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(baseTitle)),
  ).map((rule) => rule.key);

  const tags = new Set<CategoryKey>(['adult']);
  mappedFromSlugs.forEach((key) => tags.add(key));
  fromKeywords.forEach((key) => tags.add(key));

  const hasEarlySlot = slots.some((slot) => slot.startTimeLabel && Number(slot.startTimeLabel.slice(0, 2)) < 12);
  if (hasEarlySlot) {
    tags.add('kids');
  }

  return Array.from(tags);
};

const isExternalUrl = (url: string) => /^https?:/i.test(url);

const buildCalendarDays = (monthDate: Date, events: SchoolEventDisplay[]): CalendarDay[] => {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();
  const firstOfMonth = new Date(Date.UTC(year, month, 1));
  const startOffset = firstOfMonth.getUTCDay();
  const startDate = new Date(firstOfMonth);
  startDate.setUTCDate(firstOfMonth.getUTCDate() - startOffset);
  const eventsByDate = new Map<string, CalendarEventItem[]>();

  events.forEach((event) => {
    event.slots.forEach((slot) => {
      const list = eventsByDate.get(slot.isoDate) ?? [];
      list.push({ event, slot });
      eventsByDate.set(slot.isoDate, list);
    });
  });

  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i += 1) {
    const current = new Date(startDate);
    current.setUTCDate(startDate.getUTCDate() + i);
    const iso = `${current.getUTCFullYear()}-${String(current.getUTCMonth() + 1).padStart(2, '0')}-${String(
      current.getUTCDate(),
    ).padStart(2, '0')}`;
    days.push({
      isoDate: iso,
      date: current,
      label: current.getUTCDate(),
      isCurrentMonth: current.getUTCMonth() === month,
      isToday:
        iso ===
        `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}-${String(
          new Date().getUTCDate(),
        ).padStart(2, '0')}`,
      events: eventsByDate.get(iso) ?? [],
    });
  }
  return days;
};

const determineTimeBucket = (slot: NormalizedSlot): WeeklyTimeBucket => {
  if (slot.startTimeLabel) {
    const hour = Number(slot.startTimeLabel.slice(0, 2));
    if (!Number.isNaN(hour)) {
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      return 'evening';
    }
  }
  return 'afternoon';
};

const buildWeeklySchedule = (events: SchoolEventDisplay[]): WeeklySchedule => {
  const empty: WeeklySchedule = {
    morning: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    afternoon: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
    evening: { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] },
  };

  events.forEach((event) => {
    event.slots.forEach((slot) => {
      const bucket = determineTimeBucket(slot);
      empty[bucket][slot.weekday].push({ event, slot });
    });
  });

  return empty;
};

const DEFAULT_CALENDAR_MONTH = (() => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
})();

const CultureSchoolPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CategoryKey>('all');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [events, setEvents] = useState<SchoolEventDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState<Date>(DEFAULT_CALENDAR_MONTH);
  const [selectedDay, setSelectedDay] = useState<CalendarPopupState | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await request<SchoolEventsResponse>(GRAPHQL_ENDPOINT, GET_SCHOOL_EVENTS, {
          first: EVENTS_PER_PAGE,
          after: null,
        });

        if (!isMounted) return;

        const nodes = data.events?.nodes ?? [];
        const formatted = nodes
          .map((node) => transformSchoolEvent(node))
          .filter((event): event is SchoolEventDisplay => Boolean(event))
          .sort((a, b) => b.sortOrder - a.sortOrder);

        setEvents(formatted);
        setCursor(data.events?.pageInfo?.endCursor ?? null);
        setHasNextPage(Boolean(data.events?.pageInfo?.hasNextPage));
      } catch (err) {
        if (!isMounted) return;
        console.error('カルチャースクール情報の取得に失敗しました:', err);
        setEvents([]);
        setError('スクール情報の取得に失敗しました。時間をおいて再度お試しください。');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') {
      return events;
    }
    return events.filter((event) => event.categoryTags.includes(activeTab));
  }, [events, activeTab]);

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth, events), [calendarMonth, events]);
  const weeklySchedule = useMemo(() => buildWeeklySchedule(events), [events]);
  const calendarMonthLabel = useMemo(() => monthFormatter.format(calendarMonth), [calendarMonth]);
  const heroEvent = filteredEvents[0] ?? events[0] ?? null;

  const handleLoadMore = async () => {
    if (!hasNextPage || loadingMore || !cursor) return;

    setLoadingMore(true);
    setError(null);

    try {
      const data = await request<SchoolEventsResponse>(GRAPHQL_ENDPOINT, GET_SCHOOL_EVENTS, {
        first: EVENTS_PER_PAGE,
        after: cursor,
      });

      const nodes = data.events?.nodes ?? [];
      const formatted = nodes
        .map((node) => transformSchoolEvent(node))
        .filter((event): event is SchoolEventDisplay => Boolean(event));

      setEvents((prev) => {
        const map = new Map<string, SchoolEventDisplay>();
        prev.forEach((item) => map.set(item.slug, item));
        formatted.forEach((item) => map.set(item.slug, item));
        return Array.from(map.values()).sort((a, b) => b.sortOrder - a.sortOrder);
      });
      setCursor(data.events?.pageInfo?.endCursor ?? null);
      setHasNextPage(Boolean(data.events?.pageInfo?.hasNextPage));
    } catch (err) {
      console.error('スクール情報の追加取得に失敗しました:', err);
      setError('追加のスクール情報を読み込めませんでした。通信環境をご確認ください。');
    } finally {
      setLoadingMore(false);
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq((prev) => (prev === index ? null : index));
  };

  const handleCalendarDayClick = (day: CalendarDay) => {
    if (!day.events.length) return;
    setSelectedDay({
      dateLabel: dateFormatter.format(day.date),
      events: day.events,
    });
  };

  const renderCtaButton = (url: string, className: string, label: React.ReactNode) => {
    if (!url) return null;
    if (isExternalUrl(url)) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      );
    }
    return (
      <Link to={url} className={className}>
        {label}
      </Link>
    );
  };

  const heroCta = heroEvent ? (
    renderCtaButton(
      heroEvent.detailUrl,
      'bg-primary text-white px-5 py-2 text-sm font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors',
      '詳細を見る',
    )
  ) : (
    <Link
      to="/culture-school"
      className="bg-primary text-white px-5 py-2 text-sm font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors"
    >
      詳細を見る
    </Link>
  );

  return (
    <Layout showNewsletter={false}>
      <div className="bg-gray-100 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-primary">
              ホーム
            </Link>
            <div className="w-4 h-4 flex items-center justify-center mx-1">
              <i className="ri-arrow-right-s-line"></i>
            </div>
            <Link to="/pico" className="hover:text-primary">
              豊中PICO
            </Link>
            <div className="w-4 h-4 flex items-center justify-center mx-1">
              <i className="ri-arrow-right-s-line"></i>
            </div>
            <span className="font-medium text-gray-800">カルチャーサークル＆スクールPICO</span>
          </div>
        </div>
      </div>

      <section className="relative bg-gradient-to-r from-primary/5 to-primary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 md:pr-12 mb-8 md:mb-0">
              <Link to="/pico" className="inline-flex items-center text-gray-600 hover:text-primary mb-4">
                <div className="w-5 h-5 flex items-center justify-center mr-1">
                  <i className="ri-arrow-left-line"></i>
                </div>
                豊中PICOトップへ戻る
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">カルチャーサークル/カルチャースクール</h1>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                大人のための、あそびとまなびの時間です。<br />
                <br />
                「好きなことをもっとたのしみたい」<br />
                「新しいことに、ちょっと挑戦してみたい」<br />
                そんな気持ちを応援する、ユニークな講座をひらいています。<br />
                <br />
                PICOではスクールやサークルをきっかけに、
                <br />
                この街ならではの、ちょっといい交流が
                <br />
                ゆっくり育っていったらいいなと思っています。
              </p>
            </div>
            <div className="w-full md:w-1/2 relative">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="relative">
                  <img
                    src={heroEvent?.image ?? withBase('images/readdy/768d0223ae81cd791f14ac0c9ec38b83.jpeg')}
                    alt={heroEvent?.title ?? 'カルチャースクール'}
                    className="w-full h-[480px] object-cover object-center"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                    {heroEvent?.scheduleLabel ?? '新しい講座を準備中です'}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center text-xs text-gray-500 mb-2">
                    <div className="w-4 h-4 flex items-center justify-center mr-2">
                      <i className="ri-map-pin-line"></i>
                    </div>
                    {heroEvent?.locationLabel ?? '豊中PICO カルチャースクール'}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{heroEvent?.title ?? 'まもなく公開予定のスクール'}</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {heroEvent?.shortDescription ?? '近日公開の講座です。詳細が決まり次第こちらでお知らせします。'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        heroEvent?.statusClassName ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {heroEvent?.statusLabel ?? '準備中'}
                    </span>
                    {heroCta}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-2 text-center sr-only">直近のカルチャースクール</h2>
          <h2 className="text-3xl font-bold mb-2 text-center">直近のカルチャーサークル＆スクール</h2>
          <p className="text-center text-gray-600 mb-8">WordPressのイベント登録で「スクール」種別になっている講座が自動表示されます。</p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === filter.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setActiveTab(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {error && (
            <div className="max-w-3xl mx-auto mb-6 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading && (
            <p className="text-center text-sm text-gray-500 mb-6">読み込み中です…</p>
          )}

          {!loading && filteredEvents.length === 0 && (
            <div className="bg-gray-50 text-center py-12 rounded-lg text-gray-600">
              条件に一致するスクールが見つかりませんでした。
              <br />
              開講準備中の講座は順次追加されます。
            </div>
          )}

          {filteredEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredEvents.map((event) => (
                <article key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative">
                    <img src={event.image} alt={event.title} className="w-full h-72 object-cover object-top" />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {event.scheduleLabel}
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${event.statusClassName}`}>
                        {event.statusLabel}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <div className="w-4 h-4 flex items-center justify-center mr-2">
                        <i className="ri-map-pin-line"></i>
                      </div>
                      {event.locationLabel}
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-gray-800">{event.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{event.shortDescription}</p>
                    <div className="text-xs text-gray-500 space-y-1 mb-4">
                      <p>{event.priceLabel}</p>
                      <p>{event.capacityLabel}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {event.categoryTags
                          .filter((tag) => tag !== 'all')
                          .slice(0, 2)
                          .map((tag) => (
                            <span key={`${event.slug}-${tag}`} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {CATEGORY_FILTERS.find((filter) => filter.key === tag)?.label ?? 'カルチャー'}
                            </span>
                          ))}
                      </div>
                      {renderCtaButton(
                        event.detailUrl,
                        'bg-primary text-white px-4 py-2 text-sm font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors',
                        '詳細を見る',
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasNextPage && filteredEvents.length > 0 && (
            <div className="text-center" id="loadMoreContainer">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore || !hasNextPage}
                className={`inline-flex items-center bg-white border border-primary text-primary px-6 py-3 font-medium rounded-button whitespace-nowrap transition-colors ${
                  loadingMore || !hasNextPage ? 'opacity-60 cursor-not-allowed' : 'hover:bg-primary/5'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center mr-2">
                  <i className={loadingMore ? 'ri-loader-4-line animate-spin' : 'ri-refresh-line'}></i>
                </div>
                {loadingMore ? '読み込み中…' : 'もっと読み込む'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">講座スケジュール</h2>
          <div className="bg-white rounded-lg shadow-md overflow-hidden p-6">
            <div className="flex justify-between items-center mb-6">
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
                onClick={() => setCalendarMonth((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)))}
              >
                <i className="ri-arrow-left-s-line"></i>
              </button>
              <h3 className="text-xl font-bold">{calendarMonthLabel}</h3>
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100"
                onClick={() => setCalendarMonth((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)))}
              >
                <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-4 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="text-sm font-medium text-gray-500">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 mb-6">
              {calendarDays.map((day) => (
                <button
                  key={`${day.isoDate}-${day.label}`}
                  type="button"
                  className={`calendar-day w-full h-12 flex items-center justify-center rounded-full text-sm transition-colors ${
                    day.isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                  } ${day.isToday ? 'border border-primary text-primary font-semibold' : ''} ${
                    day.events.length > 0 ? 'event-day has-event hover:bg-primary/10' : ''
                  }`}
                  onClick={() => handleCalendarDayClick(day)}
                  disabled={!day.events.length}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {selectedDay && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold">{selectedDay.dateLabel}</h4>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setSelectedDay(null)}
                  >
                    <div className="w-5 h-5 flex items-center justify-center">
                      <i className="ri-close-line"></i>
                    </div>
                  </button>
                </div>
                <div className="space-y-3">
                  {selectedDay.events.map((item, index) => (
                    <div key={`${item.event.slug}-${item.slot.isoDate}-${index}`} className="bg-white rounded-lg p-4 border border-gray-100">
                      <p className="font-semibold text-gray-800 mb-1">{item.event.title}</p>
                      <p className="text-sm text-gray-600 mb-2">{item.slot.timeRangeLabel ?? '時間未定'}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                        <span>{item.event.locationLabel}</span>
                        <span>{item.event.priceLabel}</span>
                      </div>
                      {renderCtaButton(
                        item.event.reservationUrl ?? item.event.detailUrl,
                        'w-full bg-primary text-white py-2 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors text-center text-sm',
                        '詳細・予約はこちら',
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h3 className="font-bold text-lg mb-4">週間スケジュール</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="py-3 px-4 text-left font-medium">時間帯</th>
                    {WEEKDAY_TABLE_ORDER.map((weekday) => (
                      <th key={`head-${weekday}`} className="py-3 px-4 text-center font-medium">
                        {WEEKDAY_LABELS[weekday]}曜日
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {TIME_BUCKETS.map((bucket) => (
                    <tr key={bucket.key}>
                      <td className="py-3 px-4 text-gray-700 font-medium">
                        {bucket.label}
                        <br />
                        <span className="text-xs text-gray-500">({bucket.rangeLabel})</span>
                      </td>
                      {WEEKDAY_TABLE_ORDER.map((weekday) => {
                        const cells = weeklySchedule[bucket.key][weekday];
                        if (cells.length === 0) {
                          return (
                            <td key={`${bucket.key}-${weekday}`} className="py-3 px-4 text-center text-gray-300">
                              ー
                            </td>
                          );
                        }
                        return (
                          <td key={`${bucket.key}-${weekday}`} className="py-3 px-4 text-center bg-primary/5 text-gray-700">
                            {cells.slice(0, 2).map((cell, index) => (
                              <div key={`${cell.event.slug}-${cell.slot.isoDate}-${index}`} className="mb-2 last:mb-0">
                                <p className="font-medium text-sm">{cell.event.title}</p>
                                <p className="text-xs">{cell.slot.timeRangeLabel ?? '時間未定'}</p>
                              </div>
                            ))}
                            {cells.length > 2 && (
                              <p className="text-xs text-gray-500 mt-1">他 {cells.length - 2} 件</p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-bold mb-6 text-center">入会までの流れ</h3>
              <div className="space-y-6">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-start gap-4">
                    <div className="bg-primary text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                      {step}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-2">{['講座を選ぶ', '体験・見学', '入会手続き'][step - 1]}</h4>
                      <p className="text-gray-600 text-sm">
                        {[
                          '気になる講座をご覧いただき、詳細ページのフォームまたは店頭でお問い合わせください。',
                          '講座によって体験や見学も可能です。お気軽にスタッフにご相談ください。',
                          '申込書のご記入と初月受講料のお支払いで完了です。会員証をお渡しします。',
                        ][step - 1]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <h3 className="text-xl font-bold mb-6 text-center">お申し込み方法</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-3">
                      <i className="ri-computer-line"></i>
                    </div>
                    <h4 className="font-bold">オンライン予約</h4>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">各スクール詳細ページのフォームからお申し込みください。</p>
                </div>
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-3">
                      <i className="ri-phone-line"></i>
                    </div>
                    <h4 className="font-bold">お電話</h4>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">お電話でもお問い合わせ・予約を承ります。</p>
                  <p className="font-medium">
                    <a href="tel:06-7654-7069" className="hover:text-primary transition-colors">
                      06-7654-7069
                    </a>
                  </p>
                </div>
                <div>
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-3">
                      <i className="ri-store-line"></i>
                    </div>
                    <h4 className="font-bold">店頭</h4>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">豊中PICO店頭にて直接お申し込みいただけます。</p>
                  <p className="text-gray-600 text-xs mb-2">
                    〒560-0012
                    <br />
                    大阪府豊中市上野坂２丁目３−３ エルベラーノ1F
                  </p>
                  <a
                    href="https://maps.app.goo.gl/EHHTLdW2KGQA3dMt9"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-xs hover:underline"
                  >
                    アクセス・営業時間を確認する
                  </a>
                </div>
              </div>
              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <h4 className="font-bold mb-3">申し込み時の注意事項</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>定員に達し次第締め切ります。</li>
                  <li>最少催行人数に満たない場合は開講を見合わせる場合があります。</li>
                  <li>お子様向け講座は保護者の連絡先が必要です。</li>
                  <li>体験レッスンは各講座につき1回限りです。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">よくある質問</h2>
          <div className="max-w-3xl mx-auto">
            {FAQ_ITEMS.map((faq, index) => (
              <div key={faq.question} className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
                <div className={`faq-item ${index === activeFaq ? 'border-b border-gray-100' : ''}`}>
                  <button
                    type="button"
                    className="faq-question w-full flex justify-between items-center p-5 font-medium text-left hover:bg-gray-50 transition-colors"
                    onClick={() => toggleFaq(index)}
                  >
                    <span>{faq.question}</span>
                    <div className="w-5 h-5 flex items-center justify-center ml-2 transition-transform duration-200">
                      <i className={`ri-${activeFaq === index ? 'subtract' : 'add'}-line`}></i>
                    </div>
                  </button>
                  <div
                    className={`faq-answer px-5 pb-5 ${activeFaq === index ? 'bg-gray-50' : ''}`}
                    style={{ maxHeight: activeFaq === index ? '1000px' : '0', overflow: 'hidden', transition: 'max-height 0.3s ease-in-out' }}
                  >
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">カルチャーPICO Instagram</h2>
          <div className="max-w-3xl mx-auto mb-8">
            <div className="flex items-center mb-6">
              <img
                src={withBase('images/readdy/0a387989681cf20c163afcb298f6a349.jpg')}
                alt="カルチャー＆ブックカフェPICO"
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div>
                <h3 className="font-bold">カルチャー＆ブックカフェPICO</h3>
                <p className="text-sm text-gray-600">@culture_bookcafe_pico</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              絵本を通じて、親子の時間をより豊かに。
              <br />
              豊中PICOでは、読み聞かせや創作活動を通じて、子どもたちの想像力を育み、大人も子どもも楽しく学べる場を提供しています。
              <br />
              日々の活動やイベントの様子をお届けします。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1 mb-8">
            {INSTAGRAM_POSTS.map((post) => (
              <div key={post.id} className="relative group">
                <img src={post.image} alt={post.alt} className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex items-center text-white space-x-4">
                    <span className="flex items-center">
                      <i className="ri-heart-line mr-2"></i>
                      {post.likes}
                    </span>
                    <span className="flex items-center">
                      <i className="ri-chat-1-line mr-2"></i>
                      {post.comments}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a
              href="https://www.instagram.com/culture_bookcafe_pico"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-white border border-primary text-primary px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/5 transition-colors"
            >
              <div className="w-5 h-5 flex items-center justify-center mr-2">
                <i className="ri-instagram-line"></i>
              </div>
              Instagramで最新情報を見る
            </a>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">カルチャー講師募集</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-primary/5 rounded-lg p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-bold mb-4">こんな方を募集しています</h3>
                  <ul className="space-y-3 text-gray-700 text-sm">
                    <li>専門分野を活かして教えることが好きな方</li>
                    <li>地域の方々と一緒に学び合いたい方</li>
                    <li>新しい講座を企画・提案したい方</li>
                    <li>経験や知識をコミュニティに還元したい方</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">募集分野</h3>
                  <div className="grid grid-cols-3 gap-3 text-sm text-center text-gray-700">
                    {['アート・クラフト', '文学・教養', '音楽・表現', '健康・癒し', 'プログラミング', '語学', '写真・動画', '自然・環境', 'STEM・テクノロジー'].map((label) => (
                      <div key={label} className="bg-white rounded p-3">
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                まずはお気軽にお問い合わせください。
                <br />
                あなたの経験と情熱を活かせる場所をご用意しています。
              </p>
              <a
                href="https://forms.gle/LYe7YfER65Prianv9"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-primary text-white px-8 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors"
              >
                <div className="w-5 h-5 flex items-center justify-center mr-2">
                  <i className="ri-mail-line"></i>
                </div>
                講師募集についてお問い合わせ
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const transformSchoolEvent = (node: GraphqlEventNode | null): SchoolEventDisplay | null => {
  if (!node || !node.slug || !node.title) {
    return null;
  }

  const eventType = normalizeEventType(node.eventCpt?.eventType);
  if (eventType !== 'school') {
    return null;
  }

  const slots = buildSlots(node.eventCpt?.singleSlots);
  const primarySlot = slots[0];
  const scheduleParts = buildScheduleParts(primarySlot);
  const statusBadge = deriveStatusBadge(node.eventCpt, primarySlot);
  const descriptionSource =
    stripHtml(node.eventCpt?.summary) || stripHtml(node.eventDetailExt?.detailBody) || '';
  const description = descriptionSource || '詳細はスクールページをご覧ください。';

  const detailUrl = `/school-detail/${node.slug}`;
  const reservationUrl = node.eventDetailExt?.contact?.reservationOverrideUrl ?? node.eventDetailExt?.contact?.formUrl;
  const image = node.eventCpt?.mainImage?.node?.sourceUrl ?? EVENT_IMAGE_FALLBACK;

  return {
    id: node.id,
    slug: node.slug,
    title: node.title,
    description,
    shortDescription: truncateText(description, 120),
    image,
    scheduleLabel: scheduleParts.fullLabel,
    scheduleDateLabel: scheduleParts.dateLabel,
    scheduleTimeLabel: scheduleParts.timeLabel,
    statusLabel: statusBadge.label,
    statusClassName: statusBadge.className,
    categoryTags: deriveCategoryTags(node, slots),
    locationLabel: buildLocationLabel(node.eventCpt, node.eventRegions),
    priceLabel: formatPriceLabel(node.eventCpt?.price, node.eventCpt?.priceType),
    capacityLabel: formatCapacityLabel(node.eventCpt?.capacity),
    detailUrl,
    reservationUrl,
    slots,
    sortOrder: scheduleParts.sortOrder,
  };
};

export default CultureSchoolPage;
