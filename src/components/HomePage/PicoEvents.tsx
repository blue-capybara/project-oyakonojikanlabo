import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import { withBase } from '../../utils/paths';

interface EventSlot {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface EventCpt {
  summary?: string | null;
  eventType?: string | null;
  reservationOpen?: boolean | null;
  mainImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
  singleSlots?: EventSlot[] | null;
  venueRef?: {
    nodes?: Array<{
      __typename?: string | null;
      title?: string | null;
      slug?: string | null;
    }> | null;
  } | null;
}

interface EventNode {
  id: string;
  slug?: string | null;
  title?: string | null;
  eventCpt?: EventCpt | null;
  eventCategories?: {
    nodes?: Array<{ slug?: string | null; name?: string | null } | null> | null;
  } | null;
}

interface EventsResponse {
  events?: {
    nodes?: EventNode[] | null;
  } | null;
}

interface PicoEventCard {
  id: string;
  slug: string;
  title: string;
  scheduleLabel: string;
  summary: string;
  image: string;
  reservationOpen: boolean;
  tags: EventTag[];
}

interface EventTag {
  id: string;
  label: string;
  className: string;
}

const EVENT_TYPE_META: Record<string, { label: string; className: string }> = {
  author: { label: '作家イベント', className: 'bg-red-100 text-red-800' },
  exhibition: { label: '原画展', className: 'bg-blue-100 text-blue-800' },
  workshop: { label: 'ワークショップ', className: 'bg-green-100 text-green-800' },
  lecture: { label: '講演会', className: 'bg-purple-100 text-purple-800' },
  event: { label: 'イベント', className: 'bg-orange-100 text-orange-800' },
};

const fallbackCategory = { label: 'イベント', className: 'bg-gray-100 text-gray-800' };

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

const GET_PICO_EVENTS = gql`
  query GetPicoEvents {
    events(first: 6, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        slug
        title
        eventCpt {
          summary
          eventType
          reservationOpen
          mainImage {
            node {
              sourceUrl
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
        eventCategories {
          nodes {
            slug
            name
          }
        }
      }
    }
  }
`;

const stripHtml = (html?: string | null) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
};

const selectPrimarySlot = (slots?: EventSlot[] | null) => {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((slot) => slot.date) ?? slots[0];
};

const resolveCategory = (eventType?: string | null) => {
  if (!eventType) return fallbackCategory;
  return EVENT_TYPE_META[eventType] ?? fallbackCategory;
};

const formatSchedule = (slot?: EventSlot) => {
  if (!slot) return '日程未定';

  const { date, startTime, endTime } = slot;
  let dateLabel = date ?? '';

  if (date) {
    const parsed = new Date(date);
    if (!Number.isNaN(parsed.getTime())) {
      dateLabel = parsed.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
      });
    }
  }

  const normalizeTime = (time?: string | null) => {
    if (!time) return '';
    return time.length >= 5 ? time.slice(0, 5) : time;
  };

  const startLabel = normalizeTime(startTime);
  const endLabel = normalizeTime(endTime);
  const timeLabel = startLabel ? `${startLabel}${endLabel ? `〜${endLabel}` : ''}` : endLabel;

  return [dateLabel, timeLabel].filter(Boolean).join(' ');
};

const buildFallbackEvents = (): PicoEventCard[] => [
  {
    id: 'fallback-pico-1',
    slug: 'sample-pico-event-1',
    title: 'たなかしん作品展【守りたいもの】',
    scheduleLabel: '2025年05月30日〜7月13日',
    summary: 'PICO館内で開催される絵本原画展。たなかしんさんの最新作を展示します。',
    image: withBase('images/readdy/30e5f268453d5644679393e8b3b473c7.jpeg'),
    reservationOpen: true,
    tags: [
      { id: 'category', label: fallbackCategory.label, className: fallbackCategory.className },
      { id: 'reservation', label: '予約受付中', className: 'bg-emerald-100 text-emerald-700' },
    ],
  },
  {
    id: 'fallback-pico-2',
    slug: 'sample-pico-event-2',
    title: 'ひびのこえ展覧会 2025',
    scheduleLabel: '2025年06月06日〜6月22日',
    summary: 'PICO企画による体験型展示。親子で楽しめるワークショップを同時開催。',
    image: withBase('images/readdy/bf36d3a66d2c4495d815daab6a95c131.png'),
    reservationOpen: false,
    tags: [{ id: 'category', label: fallbackCategory.label, className: fallbackCategory.className }],
  },
];

const PicoEvents: React.FC = () => {
  const [events, setEvents] = useState<PicoEventCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await request<EventsResponse>(endpoint, GET_PICO_EVENTS);
        const nodes = data.events?.nodes ?? [];

        const formatted: PicoEventCard[] = nodes
          .filter((node): node is EventNode & { slug: string; title: string } => Boolean(node.slug && node.title))
          .filter((node) =>
            node.eventCategories?.nodes?.some((term) => term?.slug === 'event-pico'),
          )
          .map((node) => {
            const eventCpt = node.eventCpt ?? {};
            const slot = selectPrimarySlot(eventCpt.singleSlots);
            const category = resolveCategory(eventCpt.eventType);

            return {
              id: node.id,
              slug: node.slug ?? '',
              title: node.title ?? '',
              scheduleLabel: formatSchedule(slot),
              summary: stripHtml(eventCpt.summary),
              image: eventCpt.mainImage?.node?.sourceUrl ?? '/default.jpg',
              reservationOpen: Boolean(eventCpt.reservationOpen),
              tags: [
                { id: 'category', label: category.label, className: category.className },
                ...(eventCpt.reservationOpen
                  ? [{ id: 'reservation', label: '予約受付中', className: 'bg-emerald-100 text-emerald-700' }]
                  : []),
              ],
            };
          });

        setEvents(formatted.length > 0 ? formatted : buildFallbackEvents());
      } catch (err) {
        console.error('PICOイベントの取得に失敗しました:', err);
        setError('PICOイベントの読み込みに失敗しました');
        setEvents(buildFallbackEvents());
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <section className="py-16 bg-orange-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 flex items-center justify-center">
            <i className="ri-store-2-line text-2xl text-primary"></i>
          </div>
          <h2 className="text-3xl font-bold">PICOイベント</h2>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">読み込み中...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[600px]:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="relative group bg-white rounded-lg overflow-hidden shadow-sm transition-transform duration-300 hover:-translate-y-1"
              >
                <Link
                  to={`/event/${event.slug}`}
                  className="absolute inset-0 z-10"
                  aria-label={`${event.title}の詳細へ`}
                />
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-64 object-cover object-top"
                />
                <div className="relative z-20 p-6">
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap -mx-1 px-1 py-1">
                      {event.tags.map((tag) => (
                        <span
                          key={`${event.id}-${tag.id}`}
                          className={`shrink-0 inline-flex items-center px-3 py-1 text-xs rounded-full whitespace-nowrap leading-none ${tag.className}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <h4 className="text-lg font-bold">{event.title}</h4>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-calendar-line"></i>
                    </div>
                    <span>{event.scheduleLabel}</span>
                  </div>
                  {event.summary && (
                    <p className="mt-3 text-sm text-gray-600 line-clamp-3">{event.summary}</p>
                  )}
                  <Link
                    to={`/event/${event.slug}`}
                    className="relative z-30 mt-4 block w-full bg-primary text-white py-2 font-medium rounded-button whitespace-nowrap text-center hover:bg-primary/90 transition-colors"
                  >
                    イベント詳細
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-center mt-8">
          <Link to="/event" className="inline-flex items-center text-primary hover:text-primary/80">
            PICOでのイベントを見る
            <i className="ri-arrow-right-line ml-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PicoEvents;
