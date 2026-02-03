// src/components/mypage/FavoriteSection.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import { supabase } from '../../lib/supabaseClient';
import type { FavoriteTargetType } from '../../hooks/useFavorite';

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

const POST_SUMMARY_FIELDS = `
  slug
  title
  date
  featuredImage {
    node {
      sourceUrl
    }
  }
`;

const GET_POST_SUMMARY_BY_SLUG = gql`
  query GetPostSummaryBySlug($slug: ID!) {
    post(id: $slug, idType: SLUG) {
      ${POST_SUMMARY_FIELDS}
    }
  }
`;

const GET_POST_SUMMARY_BY_ID = gql`
  query GetPostSummaryById($id: ID!) {
    post(id: $id, idType: ID) {
      ${POST_SUMMARY_FIELDS}
    }
  }
`;

const EVENT_SUMMARY_FIELDS = `
  slug
  title
  eventCpt {
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
`;

const GET_EVENT_SUMMARY_BY_SLUG = gql`
  query GetEventSummaryBySlug($slug: ID!) {
    event(id: $slug, idType: SLUG) {
      ${EVENT_SUMMARY_FIELDS}
    }
  }
`;

const GET_EVENT_SUMMARY_BY_ID = gql`
  query GetEventSummaryById($id: ID!) {
    event(id: $id, idType: ID) {
      ${EVENT_SUMMARY_FIELDS}
    }
  }
`;

type FavoriteRow = {
  id: string;
  target_id: string | null;
  target_type: FavoriteTargetType;
  created_at: string;
};

type FavoriteArticle = {
  slug: string;
  title: string;
  dateLabel: string;
  image: string;
  createdAt: string;
};

type FavoriteEvent = {
  slug: string;
  title: string;
  dateLabel: string;
  location: string;
  image: string;
  reservationOpen: boolean;
  createdAt: string;
};

interface PostSummaryResponse {
  post: {
    slug?: string | null;
    title?: string | null;
    date?: string | null;
    featuredImage?: {
      node?: {
        sourceUrl?: string | null;
      } | null;
    } | null;
  } | null;
}

interface EventSummaryResponse {
  event: {
    slug?: string | null;
    title?: string | null;
    eventCpt?: {
      reservationOpen?: boolean | null;
      mainImage?: {
        node?: { sourceUrl?: string | null } | null;
      } | null;
      singleSlots?: Array<{
        date?: string | null;
        startTime?: string | null;
        endTime?: string | null;
      }> | null;
      venueRef?: {
        nodes?: Array<{
          __typename?: string | null;
          title?: string | null;
        }> | null;
      } | null;
    } | null;
    eventRegions?: {
      nodes?: Array<{ name?: string | null }> | null;
    } | null;
  } | null;
}

const DEFAULT_IMAGE = '/default.jpg';

const looksLikeGlobalId = (value: string) => value.includes(':') || value.includes('=');

const formatDateLabel = (iso: string | null | undefined) => {
  if (!iso) {
    return '日付未設定';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '日付未設定';
  }

  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

type EventSlot = {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
};

const selectPrimarySlot = (slots?: EventSlot[] | null) => {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((slot) => slot?.date) ?? slots[0];
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

  const normalize = (time?: string | null) => {
    if (!time) return '';
    return time.length >= 5 ? time.slice(0, 5) : time;
  };

  const start = normalize(startTime);
  const end = normalize(endTime);

  const timeLabel =
    start && end ? `${start}〜${end}` : start ? start : end ? end : '';

  return [dateLabel, timeLabel].filter(Boolean).join(' ');
};

const buildLocationLabel = (
  eventCpt?: EventSummaryResponse['event']['eventCpt'],
  regions?: EventSummaryResponse['event']['eventRegions'],
) => {
  const venueNames =
    eventCpt?.venueRef?.nodes
      ?.map((node) => node?.title)
      .filter((title): title is string => Boolean(title)) ?? [];

  if (venueNames.length > 0) {
    return venueNames.join('・');
  }

  const regionNames =
    regions?.nodes?.map((node) => node?.name).filter((name): name is string => Boolean(name)) ??
    [];

  return regionNames[0] ?? '場所未設定';
};

const getPostSummary = async (identifier: string) => {
  const attempts = looksLikeGlobalId(identifier)
    ? [
        () => request<PostSummaryResponse>(endpoint, GET_POST_SUMMARY_BY_ID, { id: identifier }),
        () => request<PostSummaryResponse>(endpoint, GET_POST_SUMMARY_BY_SLUG, { slug: identifier }),
      ]
    : [
        () => request<PostSummaryResponse>(endpoint, GET_POST_SUMMARY_BY_SLUG, { slug: identifier }),
        () => request<PostSummaryResponse>(endpoint, GET_POST_SUMMARY_BY_ID, { id: identifier }),
      ];

  for (const attempt of attempts) {
    try {
      const { post } = await attempt();
      if (post) {
        return post;
      }
    } catch {
      // Try the next attempt
    }
  }

  console.warn(`Failed to fetch post summary for identifier: ${identifier}`);
  return null;
};

const getEventSummary = async (identifier: string) => {
  const attempts = looksLikeGlobalId(identifier)
    ? [
        () => request<EventSummaryResponse>(endpoint, GET_EVENT_SUMMARY_BY_ID, { id: identifier }),
        () => request<EventSummaryResponse>(endpoint, GET_EVENT_SUMMARY_BY_SLUG, { slug: identifier }),
      ]
    : [
        () => request<EventSummaryResponse>(endpoint, GET_EVENT_SUMMARY_BY_SLUG, { slug: identifier }),
        () => request<EventSummaryResponse>(endpoint, GET_EVENT_SUMMARY_BY_ID, { id: identifier }),
      ];

  for (const attempt of attempts) {
    try {
      const { event } = await attempt();
      if (event) {
        return event;
      }
    } catch {
      // Try the next attempt
    }
  }

  console.warn(`Failed to fetch event summary for identifier: ${identifier}`);
  return null;
};

const FavoriteSection: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [articleFavorites, setArticleFavorites] = useState<FavoriteArticle[]>([]);
  const [eventFavorites, setEventFavorites] = useState<FavoriteEvent[]>([]);
  const [hasSchoolFavorites, setHasSchoolFavorites] = useState(false);
  const isMountedRef = useRef(true);

  const articleGridClasses = useMemo(
    () =>
      viewMode === 'list'
        ? 'grid grid-cols-1 gap-4'
        : 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4',
    [viewMode],
  );

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedsAuth(false);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw authError;
      }

      if (!user) {
        if (isMountedRef.current) {
          setNeedsAuth(true);
          setArticleFavorites([]);
          setEventFavorites([]);
          setHasSchoolFavorites(false);
        }
        return;
      }

      const { data, error: favoritesError } = await supabase
        .from('favorites')
        .select('id, target_id, target_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (favoritesError) {
        throw favoritesError;
      }

      const rows: FavoriteRow[] = (data ?? []).filter(Boolean) as FavoriteRow[];
      const articleEntries = rows.filter(
        (row) => row.target_type === 'post' && typeof row.target_id === 'string',
      );
      const eventEntries = rows.filter(
        (row) => row.target_type === 'event' && typeof row.target_id === 'string',
      );
      const schoolExists = rows.some((row) => row.target_type === 'school');

      const articleResults = await Promise.all(
        articleEntries.map(async (entry) => {
          const summary = await getPostSummary(entry.target_id as string);
          if (!summary || !summary.slug) {
            return null;
          }
          return {
            slug: summary.slug,
            title: summary.title ?? 'タイトル未設定',
            dateLabel: formatDateLabel(summary.date ?? null),
            image: summary.featuredImage?.node?.sourceUrl ?? DEFAULT_IMAGE,
            createdAt: entry.created_at,
          } as FavoriteArticle;
        }),
      );

      const eventResults = await Promise.all(
        eventEntries.map(async (entry) => {
          const summary = await getEventSummary(entry.target_id as string);
          if (!summary || !summary.slug) {
            return null;
          }
          const primarySlot = selectPrimarySlot(summary.eventCpt?.singleSlots ?? []);
          return {
            slug: summary.slug,
            title: summary.title ?? 'タイトル未設定',
            dateLabel: formatSchedule(primarySlot),
            location: buildLocationLabel(summary.eventCpt, summary.eventRegions),
            image: summary.eventCpt?.mainImage?.node?.sourceUrl ?? DEFAULT_IMAGE,
            reservationOpen: Boolean(summary.eventCpt?.reservationOpen),
            createdAt: entry.created_at,
          } as FavoriteEvent;
        }),
      );

      if (isMountedRef.current) {
        const sortByCreatedAtDesc = <T extends { createdAt: string }>(items: Array<T | null>) =>
          items
            .filter(Boolean)
            .map((item) => item as T)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setArticleFavorites(sortByCreatedAtDesc(articleResults));
        setEventFavorites(sortByCreatedAtDesc(eventResults));
        setHasSchoolFavorites(schoolExists);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
      if (isMountedRef.current) {
        setError('お気に入りの読み込みに失敗しました。時間をおいて再度お試しください。');
        setArticleFavorites([]);
        setEventFavorites([]);
        setHasSchoolFavorites(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadFavorites();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadFavorites();
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [loadFavorites]);

  const renderArticleContent = () => {
    if (needsAuth) {
      return (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-gray-600">
          お気に入りを表示するにはログインが必要です。
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center py-10 text-gray-500">
          読み込み中です…
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {error}
        </div>
      );
    }

    if (articleFavorites.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-gray-600">
          まだお気に入りに登録された記事はありません。
        </div>
      );
    }

    const isList = viewMode === 'list';

    return (
      <div className={articleGridClasses}>
        {articleFavorites.map((item) => (
          <div
            key={item.slug}
            className={`border border-gray-200 rounded-lg overflow-hidden ${
              isList ? 'lg:flex lg:h-40' : ''
            }`}
          >
            <div
              className={`${isList ? 'lg:w-48 lg:flex-shrink-0 lg:h-full' : ''} h-40 bg-gray-100 relative`}
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                <i className="ri-heart-fill"></i>
              </div>
            </div>
            <div className="p-4 flex flex-col justify-between flex-1">
              <div>
                <h4 className="font-bold mb-2 line-clamp-2">{item.title}</h4>
                <p className="text-sm text-gray-500 mb-4">{item.dateLabel}</p>
              </div>
              <div className="flex justify-end">
                <Link to={`/${item.slug}`} className="text-primary text-sm hover:text-primary/80">
                  続きを読む
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEventContent = () => {
    if (needsAuth) {
      return (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-gray-600">
          お気に入りを表示するにはログインが必要です。
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex justify-center py-10 text-gray-500">
          読み込み中です…
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
          {error}
        </div>
      );
    }

    if (eventFavorites.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-gray-600">
          まだお気に入りに登録されたイベントはありません。
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {eventFavorites.map((event) => (
          <div
            key={event.slug}
            className="border border-gray-200 rounded-lg p-4 flex flex-col lg:flex-row"
          >
            <div className="lg:w-1/4 mb-4 lg:mb-0 lg:mr-4">
              <div className="h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
            <div className="lg:w-3/4 flex flex-col">
              <div className="flex justify-between items-start mb-2 gap-3">
                <div>
                  <h4 className="font-bold">{event.title}</h4>
                  {event.reservationOpen && (
                    <span className="mt-2 inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                      予約受付中
                    </span>
                  )}
                </div>
                <div className="text-primary">
                  <i className="ri-heart-fill"></i>
                </div>
              </div>
              <div className="mb-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <div className="w-4 h-4 flex items-center justify-center mr-2">
                    <i className="ri-calendar-line"></i>
                  </div>
                  <span>{event.dateLabel}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 flex items-center justify-center mr-2">
                    <i className="ri-map-pin-line"></i>
                  </div>
                  <span>{event.location}</span>
                </div>
              </div>
              <div className="flex justify-end">
                <Link
                  to={`/event/${event.slug}`}
                  className="bg-primary text-white px-4 py-2 text-sm font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors"
                >
                  イベント詳細
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <section id="favorites-section">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200">お気に入り</h2>

        {/* お気に入り記事 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">お気に入り記事</h3>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`view-mode-btn px-3 py-1 rounded-full text-sm flex items-center ${
                  viewMode === 'list'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center mr-1">
                  <i className="ri-list-check"></i>
                </div>
                リスト
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`view-mode-btn px-3 py-1 rounded-full text-sm flex items-center ${
                  viewMode === 'grid'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <div className="w-4 h-4 flex items-center justify-center mr-1">
                  <i className="ri-grid-line"></i>
                </div>
                グリッド
              </button>
            </div>
          </div>

          {renderArticleContent()}

          {articleFavorites.length > 0 && !loading && !error && !needsAuth && (
            <div className="mt-4 flex justify-center">
              <Link to="/archive" className="text-primary hover:text-primary/80 flex items-center">
                記事をもっと見る
                <div className="w-5 h-5 flex items-center justify-center ml-1">
                  <i className="ri-arrow-right-s-line"></i>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* お気に入りイベント */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">お気に入りイベント</h3>
          </div>

          {hasSchoolFavorites && (
            <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700">
              スクールのお気に入りは現在表示準備中です。もうしばらくお待ちください。
            </div>
          )}

          {renderEventContent()}
        </div>
      </div>
    </section>
  );
};

export default FavoriteSection;
