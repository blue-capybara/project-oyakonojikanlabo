import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import useFavorite from '../hooks/useFavorite';
import { getFeatureFlag } from '../config/featureFlags';
import useSwipe from '../hooks/useSwipe';
import { withBase } from '../utils/paths';

const GRAPHQL_ENDPOINT = 'https://cms.oyakonojikanlabo.jp/graphql';
const EVENT_IMAGE_FALLBACK = withBase('images/readdy/30e5f268453d5644679393e8b3b473c7.jpeg');

interface GraphqlImageNode {
  sourceUrl?: string | null;
  altText?: string | null;
}

interface GraphqlImage {
  node?: GraphqlImageNode | null;
}

interface GraphqlSlotTimeDetail {
  detailStartTime?: string | null;
  detailEndTime?: string | null;
  detailLabel?: string | null;
  detailNote?: string | null;
}

interface GraphqlSlot {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  slotTimeSchedule?: GraphqlSlotTimeDetail[] | null;
}

interface GraphqlVenueNode {
  __typename?: string | null;
  title?: string | null;
  slug?: string | null;
}

interface GraphqlArtistRef {
  __typename?: string | null;
  title?: string | null;
  slug?: string | null;
  uri?: string | null;
}

interface GraphqlEventCpt {
  summary?: string | null;
  eventType?: string | null;
  price?: number | null;
  priceType?: string | null;
  notes?: string | null;
  reservationOpen?: boolean | null;
  capacity?: string | number | null;
  mainImage?: GraphqlImage | null;
  singleSlots?: (GraphqlSlot | null)[] | null;
  artists?: {
    nodes?: (GraphqlArtistRef | null)[] | null;
  } | null;
  venueRef?: {
    nodes?: (GraphqlVenueNode | null)[] | null;
  } | null;
  venueMapsUrl?: string | null;
  schoolOpeningText?: string | null;
  schoolVenueText?: string | null;
  schoolPriceText?: string | null;
  schoolCapacityText?: string | null;
  schoolRecommendations?: Array<{ title?: string | null; body?: string | null } | null> | null;
  schoolCurriculum?: Array<{ title?: string | null; body?: string | null } | null> | null;
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
  benefits?: Array<{ text?: string | null } | null> | null;
  belongings?: Array<{ text?: string | null } | null> | null;
  timeSchedule?: Array<{
    startTime?: string | null;
    endTime?: string | null;
    label?: string | null;
    note?: string | null;
  } | null> | null;
  gallery?: {
    nodes?: (GraphqlImageNode | null)[] | null;
  } | null;
}

interface GraphqlEventNode {
  id: string;
  slug?: string | null;
  title?: string | null;
  content?: string | null;
  eventCpt?: GraphqlEventCpt | null;
  eventDetailExt?: GraphqlEventDetailExt | null;
  eventRegions?: {
    nodes?: Array<{ name?: string | null } | null> | null;
  } | null;
}

interface GraphqlEventResponse {
  event: GraphqlEventNode | null;
}

interface GraphqlArtistResponse {
  artist: {
    slug?: string | null;
    title?: string | null;
    content?: string | null;
    featuredImage?: GraphqlImage | null;
    artistInformation?: {
      name?: string | null;
      title?: string | null;
      email?: string | null;
      phone?: string | null;
      profileText?: string | null;
      expertiseFields?: string[] | null;
      website?: string | null;
      instagram?: string | null;
      notes?: string | null;
      profileImage?: GraphqlImage | null;
      thumbnails?: {
        nodes?: (GraphqlImageNode | null)[] | null;
      } | null;
    } | null;
  } | null;
}

interface NormalizedSlot {
  isoDate: string;
  date: Date;
  weekday: number;
  dateLabel: string;
  timeRange: string | undefined;
  startTime: string | undefined;
  endTime: string | undefined;
  segments: GraphqlSlotTimeDetail[] | null;
}

interface ScheduleEntry {
  startTime?: string | null;
  endTime?: string | null;
  label?: string | null;
  note?: string | null;
}

interface RecommendationItem {
  title: string;
  description?: string;
  icon?: string;
}

interface CurriculumItem {
  title: string;
  description?: string;
}

interface ArtistSummary {
  slug: string;
  title?: string | null;
  uri?: string | null;
}

interface SchoolEventDetail {
  id: string;
  slug: string;
  title: string;
  summary: string;
  summaryHtml?: string | null;
  detailHtml?: string;
  locationLabel: string;
  scheduleLines: string[];
  priceLabel: string;
  capacityLabel: string;
  contact: GraphqlContact | null;
  mapUrl?: string | null;
  gallery: GraphqlImageNode[];
  benefits: string[];
  belongings: string[];
  notes: string[];
  timeSchedule: ScheduleEntry[];
  slots: NormalizedSlot[];
  artistSlugs: string[];
  artistRefs: ArtistSummary[];
  openingLines: string[];
  venueLines: string[];
  priceLines: string[];
  capacityText?: string | null;
  recommendations: RecommendationItem[];
  curriculum: CurriculumItem[];
  reservationOpen?: boolean | null;
}

interface ArtistProfile {
  slug: string;
  name?: string | null;
  title?: string | null;
  profileText?: string | null;
  profileImage?: GraphqlImageNode | null;
  gallery?: GraphqlImageNode[];
  expertise?: string[] | null;
  snsLinks?: Array<{ label?: string; url?: string }>;
}

const stripHtml = (html?: string | null) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const createIsoDate = (value?: string | null) => {
  if (!value) return null;
  const datePart = value.split('T')[0];
  if (!datePart || datePart.length !== 10) return null;
  return datePart;
};

const createDateFromIso = (iso: string) => {
  const [year, month, day] = iso.split('-').map((part) => Number(part));
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

const formatTimeLabel = (time?: string | null) => {
  if (!time) return undefined;
  const [hour, minute] = time.split(':');
  if (!hour) return undefined;
  return `${hour.padStart(2, '0')}:${(minute ?? '00').padStart(2, '0')}`;
};

const formatScheduleLine = (slot: NormalizedSlot) => {
  if (slot.timeRange) {
    return `${slot.dateLabel} ${slot.timeRange}`;
  }
  return slot.dateLabel;
};

const buildSlots = (slots?: (GraphqlSlot | null)[] | null): NormalizedSlot[] => {
  if (!slots) return [];
  const normalized = slots
    .map<NormalizedSlot | null>((slot) => {
      const isoDate = createIsoDate(slot?.date);
      if (!isoDate) return null;
      const date = createDateFromIso(isoDate);
      if (!date) return null;
      const startTime = formatTimeLabel(slot?.startTime);
      const endTime = formatTimeLabel(slot?.endTime);
      const timeRange = startTime
        ? endTime
          ? `${startTime}〜${endTime}`
          : `${startTime}〜`
        : endTime
          ? `〜${endTime}`
          : undefined;
      return {
        isoDate,
        date,
        weekday: date.getUTCDay(),
        dateLabel: date.toLocaleDateString('ja-JP', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'short',
          timeZone: 'Asia/Tokyo',
        }),
        timeRange,
        startTime,
        endTime,
        segments: slot?.slotTimeSchedule ?? null,
      };
    })
    .filter((slot): slot is NormalizedSlot => slot !== null);
  return normalized.sort((a, b) => a.date.getTime() - b.date.getTime());
};

const combineSlotDateTime = (isoDate: string, time?: string) => {
  const normalizedTime = time ? `${time}:00` : '00:00:00';
  const parsed = new Date(`${isoDate}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const determineSlotTimingStatus = (slot: NormalizedSlot): 'current' | 'upcoming' | 'past' => {
  const now = new Date();
  const start = combineSlotDateTime(slot.isoDate, slot.startTime);
  const end = combineSlotDateTime(slot.isoDate, slot.endTime) ?? start;

  if (start && end) {
    if (now >= start && now <= end) return 'current';
    return now < start ? 'upcoming' : 'past';
  }

  if (start) {
    return now < start ? 'upcoming' : 'past';
  }

  return 'upcoming';
};

const determineSlotsTimingStatus = (slots: NormalizedSlot[]): 'current' | 'upcoming' | 'past' => {
  if (slots.length === 0) {
    return 'upcoming';
  }

  let hasUpcoming = false;

  for (const slot of slots) {
    const slotStatus = determineSlotTimingStatus(slot);
    if (slotStatus === 'current') {
      return 'current';
    }
    if (slotStatus === 'upcoming') {
      hasUpcoming = true;
    }
  }

  return hasUpcoming ? 'upcoming' : 'past';
};

const buildLocationLabel = (
  eventCpt?: GraphqlEventCpt | null,
  regions?: GraphqlEventNode['eventRegions'],
) => {
  const venueNames = eventCpt?.venueRef?.nodes
    ?.map((node) => node?.title)
    .filter((title): title is string => Boolean(title));
  if (venueNames && venueNames.length > 0) {
    return venueNames.join('・');
  }
  const regionNames = regions?.nodes
    ?.map((node) => node?.name)
    .filter((name): name is string => Boolean(name));
  if (regionNames && regionNames.length > 0) {
    return regionNames.join('・');
  }
  return '開催場所：お問い合わせください';
};

const formatPriceLabel = (price?: number | null, priceType?: string | null) => {
  if (priceType === 'free' || price === 0) return '参加費：無料';
  if (typeof price === 'number' && Number.isFinite(price))
    return `参加費：¥${price.toLocaleString()}`;
  return '参加費：各講座ページをご確認ください';
};

const formatCapacityLabel = (capacity?: string | number | null) => {
  if (typeof capacity === 'number' && Number.isFinite(capacity)) return `定員：${capacity}名`;
  if (typeof capacity === 'string' && capacity.trim().length > 0) return `定員：${capacity}`;
  return '定員：お問い合わせください';
};

const splitNotes = (text?: string | null) => {
  if (!text) return [];
  return text
    .split(/\r?\n|、|。/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const splitMultilineText = (text?: string | null) => {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
};

const transformRecommendationEntries = (
  items?: Array<{ title?: string | null; body?: string | null } | null> | null,
): RecommendationItem[] => {
  if (!items) return [];
  return items
    .map((item) => ({
      title: item?.title?.trim() ?? '',
      description: item?.body?.trim() || undefined,
    }))
    .filter((item) => item.title.length > 0 || (item.description && item.description.length > 0));
};

const transformCurriculumEntries = (
  items?: Array<{ title?: string | null; body?: string | null } | null> | null,
): CurriculumItem[] => {
  if (!items) return [];
  return items
    .map((item) => ({
      title: item?.title?.trim() ?? '',
      description: item?.body?.trim() || undefined,
    }))
    .filter((item) => item.title.length > 0 || (item.description && item.description.length > 0));
};

const buildArtistSnsLinks = (
  info?: {
    website?: string | null;
    instagram?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null,
) => {
  const links: { label: string; url: string }[] = [];
  const addLink = (label: string, value?: string | null, formatter?: (value: string) => string) => {
    if (!value) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    const url = formatter ? formatter(trimmed) : trimmed;
    if (!url) return;
    links.push({ label, url });
  };

  addLink('Webサイト', info?.website);
  addLink('Instagram', info?.instagram);
  addLink('メール', info?.email, (val) => (val.startsWith('mailto:') ? val : `mailto:${val}`));
  addLink('電話', info?.phone, (val) => (val.startsWith('tel:') ? val : `tel:${val}`));

  return links;
};

const isSchoolEvent = (value?: string | null) => {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.includes('school') || value.includes('スクール');
};

const transformSchoolEventDetail = (node: GraphqlEventNode | null): SchoolEventDetail | null => {
  if (!node || !node.slug || !node.title) return null;
  if (!isSchoolEvent(node.eventCpt?.eventType)) return null;

  const slots = buildSlots(node.eventCpt?.singleSlots);
  const scheduleLines =
    slots.length > 0 ? slots.map((slot) => formatScheduleLine(slot)) : ['日程調整中'];
  const galleryNodes =
    node.eventDetailExt?.gallery?.nodes?.filter((img): img is GraphqlImageNode =>
      Boolean(img?.sourceUrl),
    ) ?? [];

  if (galleryNodes.length === 0 && node.eventCpt?.mainImage?.node?.sourceUrl) {
    galleryNodes.push(node.eventCpt.mainImage.node);
  }

  const benefits =
    node.eventDetailExt?.benefits
      ?.map((benefit) => benefit?.text?.trim())
      .filter((text): text is string => Boolean(text)) ?? [];
  const belongings =
    node.eventDetailExt?.belongings
      ?.map((item) => item?.text?.trim())
      .filter((text): text is string => Boolean(text)) ?? [];
  const notes = splitNotes(node.eventCpt?.notes);
  const timeSchedule =
    node.eventDetailExt?.timeSchedule?.filter((entry): entry is ScheduleEntry => Boolean(entry)) ??
    [];
  const openingLines = splitMultilineText(node.eventCpt?.schoolOpeningText);
  const venueLines = splitMultilineText(node.eventCpt?.schoolVenueText);
  const priceLines = splitMultilineText(node.eventCpt?.schoolPriceText);
  const capacityText = node.eventCpt?.schoolCapacityText?.trim() ?? null;
  const recommendations = transformRecommendationEntries(node.eventCpt?.schoolRecommendations);
  const curriculum = transformCurriculumEntries(node.eventCpt?.schoolCurriculum);

  const summaryHtml = node.eventCpt?.summary?.trim() || null;
  const summaryText =
    stripHtml(summaryHtml ?? undefined) ||
    stripHtml(node.eventDetailExt?.detailBody) ||
    'スクール詳細を確認してください。';
  const artistNodes =
    node.eventCpt?.artists?.nodes?.filter((artist): artist is GraphqlArtistRef =>
      Boolean(artist?.slug),
    ) ?? [];
  const artistSlugs = artistNodes.map((artist) => artist.slug!) ?? [];
  const artistRefs: ArtistSummary[] = artistNodes.map((artist) => ({
    slug: artist.slug!,
    title: artist.title ?? undefined,
    uri: artist.uri ?? undefined,
  }));

  return {
    id: node.id,
    slug: node.slug,
    title: node.title,
    summary: summaryText,
    summaryHtml,
    detailHtml: node.eventDetailExt?.detailBody ?? node.content ?? undefined,
    locationLabel: buildLocationLabel(node.eventCpt, node.eventRegions),
    scheduleLines,
    priceLabel: formatPriceLabel(node.eventCpt?.price, node.eventCpt?.priceType),
    capacityLabel: formatCapacityLabel(node.eventCpt?.capacity),
    contact: node.eventDetailExt?.contact ?? null,
    mapUrl: node.eventCpt?.venueMapsUrl ?? null,
    gallery: galleryNodes.length > 0 ? galleryNodes : [{ sourceUrl: EVENT_IMAGE_FALLBACK }],
    benefits,
    belongings,
    notes,
    timeSchedule,
    slots,
    artistSlugs,
    artistRefs,
    openingLines,
    venueLines,
    priceLines,
    capacityText,
    recommendations,
    curriculum,
    reservationOpen: node.eventCpt?.reservationOpen ?? null,
  };
};

const transformArtistDetail = (
  node: {
    slug?: string | null;
    title?: string | null;
    content?: string | null;
    featuredImage?: GraphqlImage | null;
    artistInformation?: {
      name?: string | null;
      title?: string | null;
      email?: string | null;
      phone?: string | null;
      profileText?: string | null;
      expertiseFields?: string[] | null;
      website?: string | null;
      instagram?: string | null;
      notes?: string | null;
      profileImage?: GraphqlImage | null;
      thumbnails?: {
        nodes?: (GraphqlImageNode | null)[] | null;
      } | null;
    } | null;
  } | null,
): ArtistProfile | null => {
  if (!node || !node.slug) return null;
  const gallery =
    node.artistInformation?.thumbnails?.nodes?.filter((img): img is GraphqlImageNode =>
      Boolean(img?.sourceUrl),
    ) ?? [];
  const snsLinks = buildArtistSnsLinks(node.artistInformation);
  return {
    slug: node.slug,
    name: node.artistInformation?.name ?? node.title,
    title: node.artistInformation?.title ?? undefined,
    profileText: node.artistInformation?.profileText ?? node.content ?? undefined,
    profileImage: node.artistInformation?.profileImage?.node ?? node.featuredImage?.node ?? null,
    gallery,
    expertise: node.artistInformation?.expertiseFields ?? null,
    snsLinks: snsLinks.length > 0 ? snsLinks : undefined,
  };
};

const FALLBACK_ITEMS = [
  '筆記用具',
  '生年月日のわかるもの（免許証など）',
  '相談内容のメモ（あれば）',
];

const FALLBACK_NOTES = [
  '予約時間の10分前までにお越しください',
  'キャンセルは前日までにご連絡ください',
  'ご家族の鑑定をご希望の場合は、事前にお申し出ください',
  'カウンセリング内容の録音・撮影はご遠慮ください',
];

const FALLBACK_INSTRUCTOR = {
  name: 'たなかしん',
  title: '絵本作家 / イラストレーター',
  bio: '1980年大阪府生まれ。絵本作家、イラストレーター。大学で美術を学んだ後、出版社で編集者として勤務。2010年に独立し、代表作「もりのともだち」シリーズは累計10万部を突破。',
  image: withBase('images/readdy/a92976d454ad111841ae77d449541903.jpeg'),
  gallery: [
    withBase('images/readdy/0c4b7443cdb1014111b64030c8b51ad9.jpeg'),
    withBase('images/readdy/b43238d65703b6c37b252ca7691ddf63.jpeg'),
  ],
  expertise: ['アート', 'カウンセリング'],
  snsLinks: [{ label: 'Instagram', url: 'https://www.instagram.com/' }],
};

const FALLBACK_ARTIST_PROFILE: ArtistProfile = {
  slug: 'fallback',
  name: FALLBACK_INSTRUCTOR.name,
  title: FALLBACK_INSTRUCTOR.title,
  profileText: FALLBACK_INSTRUCTOR.bio,
  profileImage: { sourceUrl: FALLBACK_INSTRUCTOR.image, altText: FALLBACK_INSTRUCTOR.name },
  gallery: FALLBACK_INSTRUCTOR.gallery.map((src, index) => ({
    sourceUrl: src,
    altText: `${FALLBACK_INSTRUCTOR.name} ${index + 1}`,
  })),
  expertise: FALLBACK_INSTRUCTOR.expertise,
  snsLinks: FALLBACK_INSTRUCTOR.snsLinks,
};

const GET_SCHOOL_EVENT_DETAIL = gql`
  query GetSchoolEventDetail($slug: ID!) {
    event(id: $slug, idType: SLUG) {
      id
      slug
      title
      content
      eventCpt {
        summary
        eventType
        price
        priceType
        notes
        reservationOpen
        capacity
        venueMapsUrl
        schoolOpeningText
        schoolVenueText
        schoolPriceText
        schoolCapacityText
        schoolRecommendations {
          title
          body
        }
        schoolCurriculum {
          title
          body
        }
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
          slotTimeSchedule {
            detailStartTime
            detailEndTime
            detailLabel
            detailNote
          }
        }
        artists {
          nodes {
            __typename
            ... on Artist {
              slug
              title
              uri
            }
          }
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
        venueMapsUrl
      }
      eventDetailExt {
        detailBody
        contact {
          phone
          email
          formUrl
          reservationOverrideUrl
        }
        benefits {
          text
        }
        belongings {
          text
        }
        timeSchedule {
          startTime
          endTime
          label
          note
        }
        gallery {
          nodes {
            sourceUrl
            altText
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
`;

const GET_ARTIST_DETAIL = gql`
  query GetArtistDetail($slug: ID!) {
    artist(id: $slug, idType: SLUG) {
      slug
      title
      content
      featuredImage {
        node {
          sourceUrl
          altText
        }
      }
      artistInformation {
        name
        title
        profileText
        expertiseFields
        profileImage {
          node {
            sourceUrl
            altText
          }
        }
        thumbnails {
          nodes {
            sourceUrl
            altText
          }
        }
        email
        phone
        website
        instagram
        notes
      }
    }
  }
`;

const SchoolDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const slug = id ?? '';
  const showMembershipFeatures = getFeatureFlag('showMembershipFeatures');
  const [eventData, setEventData] = useState<SchoolEventDetail | null>(null);
  const [eventLoading, setEventLoading] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);
  const [artistDetail, setArtistDetail] = useState<ArtistProfile | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistError, setArtistError] = useState<string | null>(null);
  const [activeArtistSlug, setActiveArtistSlug] = useState<string | null>(null);
  const artistCacheRef = useRef<Record<string, ArtistProfile>>({});
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [activeInstructorImageIndex, setActiveInstructorImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const {
    isFavorited,
    loading: favoriteLoading,
    processing: favoriteProcessing,
    error: favoriteError,
    toggleFavorite,
  } = useFavorite({ targetType: 'school', targetId: (eventData?.slug ?? slug) || null });

  const favoriteBusy = useMemo(
    () => favoriteLoading || favoriteProcessing,
    [favoriteLoading, favoriteProcessing],
  );

  useEffect(() => {
    if (!slug) return;
    let isMounted = true;
    artistCacheRef.current = {};
    setArtistDetail(null);
    setArtistError(null);
    setActiveArtistSlug(null);

    const fetchEventDetail = async () => {
      setEventLoading(true);
      setEventError(null);
      try {
        const data = await request<GraphqlEventResponse>(
          GRAPHQL_ENDPOINT,
          GET_SCHOOL_EVENT_DETAIL,
          { slug },
        );
        if (!isMounted) return;
        const transformed = transformSchoolEventDetail(data.event);
        if (!transformed) {
          setEventError('スクール詳細を取得できませんでした。');
          setEventData(null);
          setArtistDetail(null);
          setActiveArtistSlug(null);
          setArtistLoading(false);
          return;
        }
        setEventData(transformed);
        setActiveGalleryIndex(0);
        setActiveInstructorImageIndex(0);
        if (transformed.artistSlugs.length > 0) {
          setActiveArtistSlug((prev) => {
            if (prev && transformed.artistSlugs.includes(prev)) {
              return prev;
            }
            return transformed.artistSlugs[0];
          });
        } else {
          setArtistDetail(null);
          setActiveArtistSlug(null);
          setArtistLoading(false);
          if (transformed.artistRefs.length > 0) {
            setArtistError(
              '講師情報が正しく設定されていません。管理画面で作家スラッグを確認してください。',
            );
          } else {
            setArtistError(null);
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('スクール詳細の取得に失敗しました:', err);
        setEventError('スクール詳細の取得に失敗しました。時間をおいて再度お試しください。');
        setEventData(null);
        setArtistDetail(null);
        setActiveArtistSlug(null);
      } finally {
        if (isMounted) {
          setEventLoading(false);
        }
      }
    };

    fetchEventDetail();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!activeArtistSlug) {
      setArtistDetail(null);
      setArtistLoading(false);
      return;
    }

    const cached = artistCacheRef.current[activeArtistSlug];
    if (cached) {
      setArtistDetail(cached);
      setArtistError(null);
      setArtistLoading(false);
      return;
    }

    let cancelled = false;

    const fetchArtist = async () => {
      try {
        setArtistLoading(true);
        setArtistError(null);
        const data = await request<GraphqlArtistResponse>(GRAPHQL_ENDPOINT, GET_ARTIST_DETAIL, {
          slug: activeArtistSlug,
        });
        if (cancelled) return;
        const transformed = transformArtistDetail(data.artist);
        if (!transformed) {
          throw new Error('講師情報を取得できませんでした。');
        }
        artistCacheRef.current[activeArtistSlug] = transformed;
        setArtistDetail(transformed);
      } catch (err) {
        if (cancelled) return;
        console.error('講師情報の取得に失敗しました:', err);
        setArtistDetail(null);
        setArtistError('講師情報を読み込めませんでした。');
      } finally {
        if (!cancelled) {
          setArtistLoading(false);
        }
      }
    };

    fetchArtist();

    return () => {
      cancelled = true;
    };
  }, [activeArtistSlug]);

  const handleFavoriteClick = async () => {
    const result = await toggleFavorite();

    if (!result.success) {
      if (result.reason === 'auth-required') {
        setShowLoginModal(true);
      } else if (result.reason === 'missing-target') {
        alert('お気に入り対象が正しく読み込まれていません。ページを再読み込みしてください。');
      } else {
        alert('お気に入りの更新に失敗しました。時間をおいて再度お試しください。');
      }
    } else {
      setShowLoginModal(false);
    }
  };

  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
  };

  const handleCloseLoginModal = () => {
    setShowLoginModal(false);
  };

  const shareLink =
    typeof window !== 'undefined'
      ? window.location.href
      : `https://oyakonojikanlabo.jp/school-detail/${slug}`;

  const handleCopyShareLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
        alert('リンクをコピーしました');
      }
    } catch (err) {
      console.error('リンクのコピーに失敗しました:', err);
    }
  };

  const handleSelectInstructor = (slug: string) => {
    if (!slug || slug === activeArtistSlug) return;
    setActiveArtistSlug(slug);
  };

  const galleryImages = useMemo(() => {
    const title = eventData?.title ?? 'スクールのギャラリー画像';
    const rawNodes =
      eventData?.gallery?.filter((img): img is GraphqlImageNode => Boolean(img?.sourceUrl)) ?? [];
    const nodes =
      rawNodes.length > 0 ? rawNodes : [{ sourceUrl: EVENT_IMAGE_FALLBACK, altText: title }];
    const seen = new Set<string>();
    const deduped: { url: string; alt: string }[] = [];
    nodes.forEach((node) => {
      const url = (node.sourceUrl ?? '').trim();
      if (!url || seen.has(url)) return;
      seen.add(url);
      deduped.push({ url, alt: node.altText ?? title });
    });
    if (deduped.length === 0) {
      return [{ url: EVENT_IMAGE_FALLBACK, alt: title }];
    }
    return deduped;
  }, [eventData?.gallery, eventData?.title]);
  const galleryCount = galleryImages.length;
  const hasMultipleGalleryImages = galleryCount > 1;
  const activeGalleryImage = useMemo(() => {
    if (galleryCount === 0) {
      return { url: EVENT_IMAGE_FALLBACK, alt: eventData?.title ?? 'スクールのギャラリー画像' };
    }
    const safeIndex = Math.min(activeGalleryIndex, galleryCount - 1);
    return galleryImages[safeIndex] ?? galleryImages[0];
  }, [activeGalleryIndex, galleryCount, galleryImages, eventData?.title]);
  const scheduleLines = eventData?.scheduleLines ?? ['日程調整中'];
  const locationLabel = eventData?.locationLabel ?? '豊中PICO カルチャースクール';
  const priceLabel = eventData?.priceLabel ?? '参加費：お問い合わせください';
  const capacityLabel = eventData?.capacityLabel ?? '定員：お問い合わせください';
  const openingLines =
    eventData?.openingLines && eventData.openingLines.length > 0
      ? eventData.openingLines
      : scheduleLines;
  const venueLines =
    eventData?.venueLines && eventData.venueLines.length > 0
      ? eventData.venueLines
      : [locationLabel];
  const priceLines =
    eventData?.priceLines && eventData.priceLines.length > 0 ? eventData.priceLines : [priceLabel];
  const capacityText = eventData?.capacityText ?? capacityLabel;
  const contactPhone = eventData?.contact?.phone ?? '06-7654-7069';
  const contactEmail = eventData?.contact?.email;
  const reservationUrl =
    eventData?.contact?.reservationOverrideUrl ?? eventData?.contact?.formUrl ?? '';
  const reservationStatus = determineSlotsTimingStatus(eventData?.slots ?? []);
  const isReservationClosed = Boolean(
    eventData && (eventData.reservationOpen === false || reservationStatus === 'past'),
  );
  const mapUrl = eventData?.mapUrl ?? 'https://maps.app.goo.gl/TzUQQmCq7pUzkBRJ6';
  const benefits = eventData?.benefits ?? [];
  const belongingsList = eventData?.belongings?.length ? eventData.belongings : FALLBACK_ITEMS;
  const notesList = eventData?.notes?.length ? eventData.notes : FALLBACK_NOTES;
  const timeSchedule = eventData?.timeSchedule ?? [];
  const audienceList = eventData?.recommendations ?? [];
  const curriculumList = eventData?.curriculum ?? [];
  const artistOptions = eventData?.artistRefs ?? [];
  const instructor = artistDetail ?? FALLBACK_ARTIST_PROFILE;

  useEffect(() => {
    setActiveInstructorImageIndex(0);
  }, [instructor.slug]);

  const instructorImages = useMemo(() => {
    const title = instructor.name ?? '講師';
    const seen = new Set<string>();
    const images: { url: string; alt: string }[] = [];
    const addImage = (url?: string | null, alt?: string | null) => {
      if (!url) return;
      const normalized = url.trim();
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      images.push({ url: normalized, alt: alt?.trim() || title });
    };

    addImage(instructor.profileImage?.sourceUrl, instructor.profileImage?.altText);
    instructor.gallery?.forEach((image, index) => {
      addImage(image.sourceUrl, image.altText ?? `${title} ${index + 1}`);
    });

    if (images.length === 0) {
      addImage(FALLBACK_INSTRUCTOR.image, title);
    }

    return images;
  }, [instructor]);
  const hasMultipleInstructorImages = instructorImages.length > 1;
  const activeInstructorImage =
    instructorImages.length > 0
      ? instructorImages[Math.min(activeInstructorImageIndex, instructorImages.length - 1)]
      : { url: FALLBACK_INSTRUCTOR.image, alt: instructor.name ?? '講師' };

  const handleGalleryPrev = useCallback(() => {
    setActiveGalleryIndex((prev) => {
      if (galleryCount <= 1) return 0;
      return (prev - 1 + galleryCount) % galleryCount;
    });
  }, [galleryCount]);

  const handleGalleryNext = useCallback(() => {
    setActiveGalleryIndex((prev) => {
      if (galleryCount <= 1) return 0;
      return (prev + 1) % galleryCount;
    });
  }, [galleryCount]);

  const gallerySwipe = useSwipe({
    onSwipeLeft: handleGalleryNext,
    onSwipeRight: handleGalleryPrev,
  });

  const handleGalleryThumbnailClick = useCallback((index: number) => {
    setActiveGalleryIndex(index);
  }, []);

  const handleInstructorThumbnailClick = useCallback((index: number) => {
    setActiveInstructorImageIndex(index);
  }, []);

  const handleInstructorPrev = useCallback(() => {
    setActiveInstructorImageIndex((prev) => {
      const total = instructorImages.length;
      if (total <= 1) return 0;
      return (prev - 1 + total) % total;
    });
  }, [instructorImages.length]);

  const handleInstructorNext = useCallback(() => {
    setActiveInstructorImageIndex((prev) => {
      const total = instructorImages.length;
      if (total <= 1) return 0;
      return (prev + 1) % total;
    });
  }, [instructorImages.length]);

  const instructorSwipe = useSwipe({
    onSwipeLeft: handleInstructorNext,
    onSwipeRight: handleInstructorPrev,
  });

  const renderReservationButton = (className: string, label = '予約ページへ進む') => {
    if (isReservationClosed) {
      return (
        <span
          className={`${className} cursor-not-allowed bg-gray-300 text-white hover:bg-gray-300`}
          aria-disabled="true"
        >
          申込終了
        </span>
      );
    }
    if (!reservationUrl) {
      return (
        <Link to="/contact" className={className}>
          {label}
        </Link>
      );
    }
    if (/^https?:/i.test(reservationUrl)) {
      return (
        <a href={reservationUrl} target="_blank" rel="noopener noreferrer" className={className}>
          {label}
        </a>
      );
    }
    return (
      <Link to={reservationUrl} className={className}>
        {label}
      </Link>
    );
  };

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
            <Link to="/culture-school" className="hover:text-primary">
              カルチャーサークル＆スクールPICO
            </Link>
            <div className="w-4 h-4 flex items-center justify-center mx-1">
              <i className="ri-arrow-right-s-line"></i>
            </div>
            <span className="font-medium text-gray-800">{eventData?.title ?? 'スクール詳細'}</span>
          </div>
        </div>
      </div>

      {eventError && (
        <div className="bg-red-50 text-red-600 text-center text-sm py-3">{eventError}</div>
      )}

      <section className="hero-gradient py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2">
              <Link
                to="/culture-school"
                className="inline-flex items-center text-gray-600 hover:text-primary mb-4"
              >
                <div className="w-5 h-5 flex items-center justify-center mr-1">
                  <i className="ri-arrow-left-line"></i>
                </div>
                カルチャーサークル＆スクールPICO に戻る
              </Link>
              <span className="inline-block bg-primary/10 text-primary text-sm px-3 py-1 rounded-full mb-3">
                {scheduleLines[0]}
              </span>
              <h1 className="text-3xl md:text-4xl font-bold mb-6">
                {eventData?.title ?? 'スクール詳細'}
              </h1>
              {eventData?.summaryHtml ? (
                <div
                  className="event-rich-text text-lg text-gray-700 leading-relaxed mb-8"
                  dangerouslySetInnerHTML={{ __html: eventData.summaryHtml }}
                />
              ) : (
                <p className="text-lg text-gray-700 mb-8">
                  {eventData?.summary ?? '詳細は近日公開予定です。'}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-2">
                      <i className="ri-calendar-line"></i>
                    </div>
                    <h3 className="font-bold text-gray-800">開講日時</h3>
                  </div>
                  <ul className="text-gray-600 text-sm space-y-1">
                    {openingLines.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                  <div className="mt-3 text-sm">
                    <a
                      href={`tel:${contactPhone}`}
                      className="inline-flex items-center text-primary hover:text-primary/80"
                    >
                      <div className="w-4 h-4 flex items-center justify-center mr-1">
                        <i className="ri-phone-line"></i>
                      </div>
                      お問い合わせ：{contactPhone}
                    </a>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-2">
                      <i className="ri-map-pin-line"></i>
                    </div>
                    <h3 className="font-bold text-gray-800">開催場所</h3>
                  </div>
                  <ul className="text-gray-600 text-sm space-y-1 mb-2">
                    {venueLines.map((line, index) => (
                      <li key={`venue-${index}`}>{line}</li>
                    ))}
                  </ul>
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary hover:text-primary/80 text-sm"
                  >
                    <div className="w-4 h-4 flex items-center justify-center mr-1">
                      <i className="ri-map-2-line"></i>
                    </div>
                    Googleマップで見る
                  </a>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-2">
                      <i className="ri-money-yen-circle-line"></i>
                    </div>
                    <h3 className="font-bold text-gray-800">料金</h3>
                  </div>
                  <ul className="text-gray-600 text-sm space-y-1">
                    {priceLines.map((line, index) => (
                      <li key={`price-${index}`}>{line}</li>
                    ))}
                  </ul>
                  {benefits.length > 0 && (
                    <ul className="mt-2 text-sm text-gray-600 space-y-1">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <i className="ri-checkbox-circle-line text-primary mr-2 mt-0.5"></i>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-2">
                      <i className="ri-group-line"></i>
                    </div>
                    <h3 className="font-bold text-gray-800">定員</h3>
                  </div>
                  <p className="text-gray-600">{capacityText}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                {renderReservationButton(
                  'bg-primary text-white px-8 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors flex-1 text-center',
                )}
                {showMembershipFeatures && (
                  <button
                    onClick={handleFavoriteClick}
                    disabled={favoriteBusy}
                    className={`border border-primary text-primary px-8 py-3 font-medium rounded-button whitespace-nowrap transition-colors flex items-center justify-center ${
                      favoriteBusy ? 'cursor-not-allowed opacity-60' : 'hover:bg-primary/5'
                    }`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className={`ri-heart-${isFavorited ? 'fill' : 'line'}`}></i>
                    </div>
                    お気に入り
                  </button>
                )}
                <button
                  onClick={handleShareClick}
                  className={`border border-primary text-primary px-8 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/5 transition-colors flex items-center justify-center ${
                    showMembershipFeatures ? '' : 'flex-1'
                  }`}
                >
                  <div className="w-5 h-5 flex items-center justify-center mr-2">
                    <i className="ri-share-line"></i>
                  </div>
                  シェアする
                </button>
              </div>
              {showMembershipFeatures && favoriteError && (
                <p className="text-sm text-red-500 mt-2" role="alert">
                  {favoriteError}
                </p>
              )}
            </div>
            <div className="w-full md:w-1/2">
              <div className="relative group">
                <div
                  className="relative w-full overflow-hidden rounded-2xl bg-gray-50 shadow-lg"
                  style={{ aspectRatio: '3 / 4', touchAction: gallerySwipe.touchAction }}
                  {...gallerySwipe.bind}
                >
                  <img
                    src={activeGalleryImage.url}
                    alt={activeGalleryImage.alt ?? eventData?.title ?? 'スクールイメージ'}
                    className="h-full w-full object-cover object-center"
                  />
                  {hasMultipleGalleryImages && (
                    <>
                      <button
                        type="button"
                        onClick={handleGalleryPrev}
                        aria-label="前の画像へ"
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow transition hover:bg-white"
                      >
                        <i className="ri-arrow-left-s-line text-2xl"></i>
                      </button>
                      <button
                        type="button"
                        onClick={handleGalleryNext}
                        aria-label="次の画像へ"
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow transition hover:bg-white"
                      >
                        <i className="ri-arrow-right-s-line text-2xl"></i>
                      </button>
                    </>
                  )}
                  {hasMultipleGalleryImages && (
                    <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                      {activeGalleryIndex + 1}/{galleryCount}
                    </div>
                  )}
                </div>
                {hasMultipleGalleryImages && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {galleryImages.map((image, index) => (
                      <button
                        key={`${image.url}-${index}`}
                        type="button"
                        onClick={() => handleGalleryThumbnailClick(index)}
                        className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          index === activeGalleryIndex
                            ? 'border-primary ring-2 ring-primary/40'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`ギャラリー画像${index + 1}を表示`}
                      >
                        <img
                          src={image.url}
                          alt={image.alt ?? `${eventData?.title ?? 'スクール'}のギャラリー画像`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3">
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100">
                  {eventLoading && (
                    <p className="text-sm text-gray-500">スクール情報を読み込み中です…</p>
                  )}
                  {!eventLoading && (
                    <>
                      {eventData?.detailHtml ? (
                        <article
                          className="event-rich-text"
                          dangerouslySetInnerHTML={{ __html: eventData.detailHtml }}
                        />
                      ) : eventData?.summaryHtml ? (
                        <article
                          className="event-rich-text"
                          dangerouslySetInnerHTML={{ __html: eventData.summaryHtml }}
                        />
                      ) : (
                        <p className="text-gray-700 leading-relaxed">
                          {eventData?.summary ?? '詳細は準備中です。'}
                        </p>
                      )}
                      <div className="mt-8">
                        <h3 className="text-xl font-bold mb-3">持ち物</h3>
                        <ul className="space-y-2">
                          {belongingsList.map((item, index) => (
                            <li key={index} className="flex items-start text-gray-700">
                              <i className="ri-checkbox-circle-line text-primary mr-2 mt-0.5"></i>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-8">
                        <h3 className="text-xl font-bold mb-3">注意事項</h3>
                        <ul className="space-y-2">
                          {notesList.map((note, index) => (
                            <li key={index} className="flex items-start text-gray-700">
                              <i className="ri-information-line text-primary mr-2 mt-0.5"></i>
                              <span>{note}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 仕様: recommendations / curriculum が空の場合は該当ブロックを非表示にする（ダミーデータは表示しない） */}
              {audienceList.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">こんな方におすすめです</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {audienceList.map((item, index) => (
                      <div
                        key={`${item.title}-${index}`}
                        className="bg-gray-50 rounded-lg p-4 flex items-start"
                      >
                        <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-3 flex-shrink-0 font-bold">
                          {item.icon ? <i className={item.icon}></i> : <span>{index + 1}</span>}
                        </div>
                        <div>
                          <h4 className="font-bold mb-1">{item.title}</h4>
                          {item.description && (
                            <p className="text-gray-700 text-sm">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {curriculumList.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4">カリキュラム・内容</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-4">
                      {curriculumList.map((item, index) => (
                        <div key={item.title} className="flex items-start">
                          <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary rounded-full mr-3 flex-shrink-0">
                            <span className="font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-bold mb-1">{item.title}</h4>
                            <p className="text-gray-700 text-sm">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold mb-4">タイムスケジュール</h3>
                {timeSchedule.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <ul className="space-y-3">
                      {timeSchedule.map((entry, index) => (
                        <li key={`${entry.label}-${index}`} className="flex items-start">
                          <div className="w-24 text-sm text-gray-500">
                            {formatTimeLabel(entry.startTime) ?? '--:--'}〜
                            {formatTimeLabel(entry.endTime) ?? '--:--'}
                          </div>
                          <div>
                            <p className="font-bold">{entry.label ?? 'プログラム'}</p>
                            {entry.note && <p className="text-sm text-gray-600">{entry.note}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">スケジュールは現在調整中です。</p>
                )}
              </div>
            </div>

            <div className="w-full md:w-1/3">
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="bg-primary text-white p-4">
                  <h2 className="text-xl font-bold">予約する</h2>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-gray-700 text-sm">
                    予約は専用フォームから受け付けております。下記のボタンから予約ページへお進みください。
                  </p>
                  {renderReservationButton(
                    'block w-full bg-primary text-white text-center px-6 py-3 rounded-button font-medium hover:bg-primary/90 transition-colors',
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="p-6 space-y-4">
                  <h2 className="text-xl font-bold">お問い合わせ</h2>
                  <div className="flex items-start">
                    <div className="w-6 h-6 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                      <i className="ri-phone-line"></i>
                    </div>
                    <div>
                      <h3 className="font-bold mb-1">電話</h3>
                      <a
                        href={`tel:${contactPhone}`}
                        className="text-gray-600 hover:text-primary transition-colors"
                      >
                        {contactPhone}
                      </a>
                    </div>
                  </div>
                  {contactEmail && (
                    <div className="flex items-start">
                      <div className="w-6 h-6 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                        <i className="ri-mail-line"></i>
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">メール</h3>
                        <a
                          href={`mailto:${contactEmail}`}
                          className="text-gray-600 hover:text-primary transition-colors"
                        >
                          {contactEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-xl font-bold mb-4">アクセス</h2>
                  <p className="text-gray-600 mb-4">{locationLabel}</p>
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-primary font-medium hover:underline"
                  >
                    Googleマップを開く
                    <div className="w-5 h-5 flex items-center justify-center ml-1">
                      <i className="ri-arrow-right-line"></i>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {artistOptions.length > 1 && (
              <div className="flex flex-wrap gap-3 p-6 pb-0">
                {artistOptions.map((artist) => (
                  <button
                    key={artist.slug}
                    type="button"
                    onClick={() => handleSelectInstructor(artist.slug)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      activeArtistSlug === artist.slug
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-primary border-primary/40 hover:border-primary/80'
                    }`}
                  >
                    {artist.title ?? artist.slug}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              <div className="md:col-span-1">
                <div
                  className="overflow-hidden rounded-2xl shadow-md"
                  style={{ aspectRatio: '1 / 1', touchAction: instructorSwipe.touchAction }}
                  {...instructorSwipe.bind}
                >
                  <img
                    src={activeInstructorImage.url}
                    alt={activeInstructorImage.alt ?? instructor.name ?? '講師'}
                    className="w-full h-full object-cover"
                  />
                </div>
                {hasMultipleInstructorImages && (
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                    {instructorImages.map((image, index) => (
                      <button
                        key={`${image.url}-${index}`}
                        type="button"
                        onClick={() => handleInstructorThumbnailClick(index)}
                        className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          index === activeInstructorImageIndex
                            ? 'border-primary ring-2 ring-primary/40'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        aria-label={`講師ギャラリー画像${index + 1}を表示`}
                      >
                        <img
                          src={image.url}
                          alt={image.alt}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <h3 className="text-2xl font-bold mb-2">
                  {instructor.name ?? FALLBACK_INSTRUCTOR.name}
                </h3>
                <p className="text-primary font-medium mb-4">
                  {instructor.title ?? FALLBACK_INSTRUCTOR.title}
                </p>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {instructor.profileText ?? FALLBACK_INSTRUCTOR.bio}
                </p>
                {instructor.expertise && instructor.expertise.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-bold mb-2">得意分野</h4>
                    <div className="flex flex-wrap gap-2">
                      {instructor.expertise.map((field) => (
                        <span
                          key={field}
                          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {instructor.snsLinks && instructor.snsLinks.length > 0 && (
                  <div>
                    <h4 className="font-bold mb-2">SNS</h4>
                    <div className="flex flex-wrap gap-3 text-primary">
                      {instructor.snsLinks.map((sns) => (
                        <a
                          key={`${sns.label}-${sns.url}`}
                          href={sns.url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {sns.label ?? '公式サイト'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {artistLoading && (
                  <p className="text-sm text-gray-500 mt-4">講師情報を読み込み中です…</p>
                )}
                {artistError && (
                  <p className="text-sm text-red-500 mt-4" role="alert">
                    {artistError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">シェアする</h3>
              <button onClick={handleCloseShareModal} className="text-gray-500 hover:text-gray-700">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-close-line ri-lg"></i>
                </div>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="flex items-center justify-center gap-2 bg-[#1DA1F2] text-white px-4 py-3 rounded-lg hover:bg-[#1DA1F2]/90 transition-colors">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-twitter-x-fill"></i>
                </div>
                Twitter
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#1877F2] text-white px-4 py-3 rounded-lg hover:bg-[#1877F2]/90 transition-colors">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-facebook-fill"></i>
                </div>
                Facebook
              </button>
              <button className="flex items-center justify-center gap-2 bg-[#00B900] text-white px-4 py-3 rounded-lg hover:bg-[#00B900]/90 transition-colors">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-line-fill"></i>
                </div>
                LINE
              </button>
              <button className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors">
                <div className="w-5 h-5 flex items-center justify-center">
                  <i className="ri-mail-fill"></i>
                </div>
                メール
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="w-full bg-gray-50 px-4 py-3 pr-24 rounded-lg text-sm"
              />
              <button
                onClick={handleCopyShareLink}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:text-primary/80 font-medium text-sm"
              >
                コピー
              </button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">ログインが必要です</h3>
              <button onClick={handleCloseLoginModal} className="text-gray-500 hover:text-gray-700">
                <div className="w-6 h-6 flex items-center justify-center">
                  <i className="ri-close-line ri-lg"></i>
                </div>
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              お気に入りにチェックを付けると、マイページにアーカイブされ、いつでもチェックできます。機能を使用するには、ログインまたは会員登録が必要です。
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="bg-primary text-white px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors text-center"
              >
                ログイン
              </Link>
              <Link
                to="/register"
                className="border border-primary text-primary px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/5 transition-colors text-center"
              >
                新規会員登録
              </Link>
            </div>
          </div>
        </div>
      )}

      <button
        id="backToTop"
        className="fixed bottom-8 right-8 bg-primary/90 hover:bg-primary text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="ri-arrow-up-line ri-lg"></i>
      </button>
    </Layout>
  );
};

export default SchoolDetailPage;
