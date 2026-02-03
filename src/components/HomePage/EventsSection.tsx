import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { gql, request } from 'graphql-request';

interface EventSlot {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface EventCpt {
  summary?: string | null;
  eventType?: string | null;
  price?: number | null;
  priceType?: string | null;
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
  venueMapsUrl?: string | null;
}

interface EventNode {
  id: string;
  slug?: string | null;
  title?: string | null;
  eventCpt?: EventCpt | null;
  eventRegions?: {
    nodes: Array<{ name?: string | null }>;
  } | null;
}

interface EventsResponse {
  events: {
    nodes: EventNode[];
  };
}

interface EventCard {
  id: string;
  slug: string;
  title: string;
  categoryLabel: string;
  categoryClass: string;
  locationLabel: string;
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

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

const GET_EVENTS = gql`
  query GetEvents {
    events(first: 3, where: { orderby: { field: DATE, order: DESC } }) {
      nodes {
        id
        slug
        title
        eventCpt {
          summary
          eventType
          price
          priceType
          reservationOpen
          venueMapsUrl
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
        eventRegions {
          nodes {
            name
          }
        }
      }
    }
  }
`;

const EVENT_TYPE_META: Record<string, { label: string; className: string }> = {
  author: { label: '作家イベント', className: 'bg-red-100 text-red-800' },
  exhibition: { label: '原画展', className: 'bg-blue-100 text-blue-800' },
  workshop: { label: 'ワークショップ', className: 'bg-green-100 text-green-800' },
  lecture: { label: '講演会', className: 'bg-purple-100 text-purple-800' },
  event: { label: 'イベント', className: 'bg-orange-100 text-orange-800' },
};

const fallbackCategory = { label: 'イベント', className: 'bg-gray-100 text-gray-800' };

const stripHtml = (html?: string | null) => {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
};

const selectPrimarySlot = (slots?: EventSlot[] | null) => {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((slot) => slot.date) ?? slots[0];
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

  const timeLabel = startTime
    ? `${startTime}${endTime ? `〜${endTime}` : ''}`
    : endTime ?? '';

  return [dateLabel, timeLabel].filter(Boolean).join(' ');
};

const resolveCategory = (eventType?: string | null) => {
  if (!eventType) return fallbackCategory;
  return EVENT_TYPE_META[eventType] ?? fallbackCategory;
};

const buildLocationLabel = (
  eventCpt?: EventCpt | null,
  regions?: { nodes: Array<{ name?: string | null }> } | null,
) => {
  const venueNames = eventCpt?.venueRef?.nodes
    ?.map((node) => node?.title)
    .filter((title): title is string => Boolean(title));

  if (venueNames && venueNames.length > 0) {
    return venueNames.join('・');
  }

  const regionNames = regions?.nodes
    ?.map((node) => node.name)
    .filter((name): name is string => Boolean(name));

  if (regionNames && regionNames.length > 0) {
    return regionNames.join('・');
  }

  return '開催地未定';
};

const MAX_LOCATION_CHARS = 12;

const truncateLocation = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
};

const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventCard[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await request<EventsResponse>(endpoint, GET_EVENTS);
        const nodes = data.events?.nodes ?? [];

        const formatted: EventCard[] = nodes
          .filter((node): node is EventNode & { slug: string; title: string } => Boolean(node.slug && node.title))
          .map((node) => {
            const eventCpt = node.eventCpt ?? {};
            const category = resolveCategory(eventCpt.eventType);
            const slot = selectPrimarySlot(eventCpt.singleSlots);
            const regionTags =
              node.eventRegions?.nodes
                ?.map((region) => region?.name)
                .filter((name): name is string => Boolean(name)) ?? [];

            return {
              id: node.id,
              slug: node.slug ?? '',
              title: node.title ?? '',
              categoryLabel: category.label,
              categoryClass: category.className,
              locationLabel: truncateLocation(
                buildLocationLabel(eventCpt, node.eventRegions),
                MAX_LOCATION_CHARS,
              ),
              scheduleLabel: formatSchedule(slot),
              summary: stripHtml(eventCpt.summary),
              image: eventCpt.mainImage?.node?.sourceUrl ?? '/default.jpg',
              reservationOpen: Boolean(eventCpt.reservationOpen),
              tags: [
                { id: 'category', label: category.label, className: category.className },
                ...(eventCpt.reservationOpen
                  ? [{ id: 'reservation', label: '予約受付中', className: 'bg-emerald-100 text-emerald-700' }]
                  : []),
                ...regionTags.map((label, index) => ({
                  id: `region-${index}`,
                  label,
                  className: 'bg-gray-100 text-gray-800',
                })),
              ],
            };
          });

        setEvents(formatted);
      } catch (err) {
        console.error('イベント情報の取得に失敗しました:', err);
        setError('イベント情報の読み込みに失敗しました');
      }
    };

    fetchEvents();
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col min-[600px]:flex-row justify-between items-start min-[600px]:items-center gap-4 min-[600px]:gap-0 mb-8">
          <h2 className="text-3xl font-bold">絵本アートイベント情報</h2>
          <Link
            to="/event"
            className="text-primary font-medium flex items-center whitespace-nowrap hover:text-primary/80"
          >
            イベントページへ
            <div className="w-5 h-5 flex items-center justify-center ml-1">
              <i className="ri-arrow-right-line"></i>
            </div>
          </Link>
        </div>

        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {events.length === 0 && !error ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-white px-6 py-12 text-center text-gray-500">
            現在表示できるイベントはありません。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="relative group bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1"
              >
                <Link
                  to={`/event/${event.slug}`}
                  className="absolute inset-0 z-10"
                  aria-label={`${event.title}の詳細へ`}
                />
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover object-center"
                />
                <div className="relative z-20 p-6">
                  <div className="mb-3 space-y-1">
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap -mx-1 px-1 py-1">
                      {event.tags.map((tag) => (
                        <span
                          key={`${event.id}-${tag.id}`}
                          className={`shrink-0 whitespace-nowrap inline-flex px-3 py-1 text-xs rounded-full ${tag.className}`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                    <span className="block text-gray-500 text-sm">{event.locationLabel}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 line-clamp-2">{event.title}</h3>
                  <div className="flex items-center text-gray-600 mb-2 text-sm">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-calendar-line"></i>
                    </div>
                    <span>{event.scheduleLabel}</span>
                  </div>
                  {event.summary && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.summary}</p>
                  )}
                  <Link
                    to={`/event/${event.slug}`}
                    className="relative z-30 block w-full bg-primary text-white py-2 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors text-center"
                  >
                    イベント詳細
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default EventsSection;
