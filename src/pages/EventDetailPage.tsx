import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import Breadcrumb from '../components/Breadcrumb';
import useFavorite from '../hooks/useFavorite';
import { getFeatureFlag } from '../config/featureFlags';
import useSwipe from '../hooks/useSwipe';
import { send404Event } from '../lib/ga';
import Seo from '../components/seo/Seo';
import { withBase } from '../utils/paths';

interface EventScheduleEntry {
  time: string;
  activity: string;
}

interface EventContact {
  phone?: string | null;
  email?: string | null;
  formUrl?: string | null;
  reservationOverrideUrl?: string | null;
}

interface EventArtist {
  name: string;
  slug?: string | null;
  url?: string;
}

interface ArtistMedia {
  url: string;
  alt?: string;
}

interface ArtistSnsLink {
  label: string;
  url: string;
  icon?: string;
}

interface ArtistRelatedBook {
  title?: string;
  publisher?: string;
  releaseDate?: string;
  isbn?: string;
  coverImage?: ArtistMedia;
}

interface ArtistProfile {
  id: string;
  slug: string;
  name: string;
  mainImage?: ArtistMedia;
  gallery: ArtistMedia[];
  biographyHtml?: string;
  biographyText?: string;
  works?: string[];
  snsLinks?: ArtistSnsLink[];
  jobTitle?: string;
  expertise?: string[];
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  notes?: string;
  relatedBooks?: ArtistRelatedBook[];
  isActive?: boolean | null;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  dateLines?: string[];
  location: string;
  region: string;
  image: string;
  galleryImages?: ArtistMedia[];
  slotSchedules?: EventSlotSchedule[];
  status: 'current' | 'upcoming' | 'past';
  description?: string;
  descriptionHtml?: string;
  detailHtml?: string;
  timeScheduleHtml?: string;
  price?: string;
  capacity?: string;
  contact?: EventContact;
  schedule?: EventScheduleEntry[];
  mapUrl?: string;
  artists?: EventArtist[];
  benefits?: string[];
  belongings?: string[];
  notes?: string;
  reservationOpen?: boolean | null;
}

interface SlotTimeDetailEntry {
  detailStartTime?: string | null;
  detailEndTime?: string | null;
  detailLabel?: string | null;
  detailNote?: string | null;
}

interface EventSlot {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  slotTimeSchedule?: SlotTimeDetailEntry[] | null;
}

interface EventTimeScheduleEntry {
  startTime?: string | null;
  endTime?: string | null;
  label?: string | null;
  note?: string | null;
}

interface EventSlotSchedule {
  id: string;
  label: string;
  entries: EventScheduleEntry[];
}

interface EventCpt {
  summary?: string | null;
  eventType?: string | null;
  price?: number | null;
  priceType?: string | null;
  notes?: string | null;
  reservationOpen?: boolean | null;
  capacity?: string | number | null;
  mainImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
  singleSlots?: EventSlot[] | null;
  artists?: {
    nodes?: Array<{
      __typename?: string | null;
      title?: string | null;
      slug?: string | null;
      name?: string | null;
      uri?: string | null;
    }> | null;
  } | null;
  venueRef?: {
    nodes?: Array<{
      __typename?: string | null;
      title?: string | null;
      slug?: string | null;
    }> | null;
  } | null;
  venueMapsUrl?: string | null;
}

interface EventDetailExt {
  detailBody?: string | null;
  contact?: EventContact | null;
  benefits?: Array<{ text?: string | null } | null> | null;
  belongings?: Array<{ text?: string | null } | null> | null;
  timeSchedule?: (EventTimeScheduleEntry | null)[] | null;
  gallery?: {
    nodes?: Array<{
      sourceUrl?: string | null;
      altText?: string | null;
    } | null> | null;
  } | null;
}

interface EventNode {
  id: string;
  slug?: string | null;
  title?: string | null;
  content?: string | null;
  eventCpt?: EventCpt | null;
  eventDetailExt?: EventDetailExt | null;
  eventRegions?: {
    nodes: Array<{ name?: string | null }>;
  } | null;
}

interface EventResponse {
  event: EventNode | null;
}

interface ArtistNode {
  id: string;
  slug?: string | null;
  title?: string | null;
  content?: string | null;
  featuredImage?: {
    node?: {
      sourceUrl?: string | null;
      altText?: string | null;
    } | null;
  } | null;
  artistInformation?: {
    profileImage?: {
      node?: {
        sourceUrl?: string | null;
        altText?: string | null;
      } | null;
    } | null;
    thumbnails?: {
      nodes?: Array<{
        sourceUrl?: string | null;
        altText?: string | null;
      } | null> | null;
    } | null;
    name?: string | null;
    title?: string | null;
    expertiseFields?: Array<string | null> | null;
    email?: string | null;
    phone?: string | null;
    profileText?: string | null;
    website?: string | null;
    instagram?: string | null;
    notes?: string | null;
    relatedBooks?: Array<{
      title?: string | null;
      publisher?: string | null;
      releaseDate?: string | null;
      isbn?: string | null;
      coverImage?: {
        node?: {
          sourceUrl?: string | null;
          altText?: string | null;
        } | null;
      } | null;
    } | null> | null;
    active?: boolean | null;
  } | null;
}

interface ArtistResponse {
  artist: ArtistNode | null;
}

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';
const isDevMode = import.meta.env?.MODE === 'development';
const FALLBACK_EVENT_IMAGE = withBase('images/readdy/30e5f268453d5644679393e8b3b473c7.jpeg');

const GET_EVENT_DETAIL = gql`
  query GetEventDetail($slug: ID!) {
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
        mainImage {
          node {
            sourceUrl
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
              title
              slug
              uri
            }
            ... on Post {
              title
              slug
              uri
            }
            ... on Page {
              title
              slug
              uri
            }
            ... on Space {
              title
              slug
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
      id
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
        expertiseFields
        email
        phone
        profileText
        website
        instagram
        notes
        active
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
        relatedBooks {
          title
          publisher
          releaseDate
          isbn
          coverImage {
            node {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  }
`;

const selectPrimarySlot = (slots?: EventSlot[] | null) => {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((slot) => slot.date) ?? slots[0];
};

const toHourMinute = (time?: string | null) => {
  if (!time) return null;
  const trimmed = time.trim();
  if (trimmed.length >= 5 && trimmed.includes(':')) {
    return trimmed.slice(0, 5);
  }
  return trimmed.length > 0 ? trimmed : null;
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

  const normalizedStart = toHourMinute(startTime);
  const normalizedEnd = toHourMinute(endTime);

  const timeLabel = normalizedStart
    ? `${normalizedStart}${normalizedEnd ? `〜${normalizedEnd}` : ''}`
    : normalizedEnd ?? '';

  return [dateLabel, timeLabel].filter(Boolean).join(' ');
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

const combineDateTime = (date?: string | null, time?: string | null) => {
  if (!date) return null;
  const normalizedTime = time ? (time.length === 5 ? `${time}:00` : time) : '00:00:00';
  return new Date(`${date}T${normalizedTime}`);
};

const determineStatus = (slot?: EventSlot): Event['status'] => {
  const now = new Date();
  if (!slot?.date) {
    return 'upcoming';
  }

  const start = combineDateTime(slot.date, slot.startTime);
  const end = combineDateTime(slot.date, slot.endTime);

  if (start && !Number.isNaN(start.getTime())) {
    if (end && !Number.isNaN(end.getTime())) {
      if (now >= start && now <= end) return 'current';
      return now < start ? 'upcoming' : 'past';
    }

    if (start.toDateString() === now.toDateString()) return 'current';
    return now < start ? 'upcoming' : 'past';
  }

  return 'upcoming';
};

const formatPrice = (price?: number | null, priceType?: string | null) => {
  if (priceType === 'free') {
    return '無料';
  }

  if (priceType === 'paid') {
    if (price === null || price === undefined) {
      return '有料';
    }
    const formatted = `${price.toLocaleString('ja-JP')}円`;
    return `有料（${formatted}）`;
  }

  if (price === null || price === undefined) {
    return '無料';
  }

  return `${price.toLocaleString('ja-JP')}円`;
};

const formatCapacity = (capacity?: string | number | null) => {
  if (capacity === null || capacity === undefined) return '定員未定';
  if (typeof capacity === 'number') {
    return `${capacity}名`;
  }

  const trimmed = capacity.trim();
  return trimmed.length > 0 ? trimmed : '定員未定';
};

const stripHtml = (value?: string | null) => {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, '').trim();
};

const createScheduleEntries = (slots?: EventSlot[] | null): Event['schedule'] => {
  if (!slots || slots.length === 0) return undefined;

  return slots.map((slot, index) => ({
    time: formatSchedule(slot),
    activity: slots.length > 1 ? `第${index + 1}部` : '開催時間',
  }));
};

const buildDateLines = (slots?: EventSlot[] | null): string[] | undefined => {
  if (!slots || slots.length === 0) return undefined;

  const uniqueLabels = Array.from(
    new Set(
      slots
        .map((slot) => (slot ? formatSchedule(slot) : ''))
        .map((label) => label.trim())
        .filter((label) => label.length > 0),
    ),
  );

  return uniqueLabels.length > 0 ? uniqueLabels : undefined;
};

const buildGalleryImages = (
  gallery?: {
    nodes?: Array<{
      sourceUrl?: string | null;
      altText?: string | null;
    } | null> | null;
  } | null,
): ArtistMedia[] | undefined => {
  const nodes = gallery?.nodes;
  if (!nodes || nodes.length === 0) return undefined;

  const images = nodes
    .map((node) => {
      if (!node?.sourceUrl) return null;
      return {
        url: node.sourceUrl,
        alt: node.altText ?? undefined,
      } as ArtistMedia;
    })
    .filter((item): item is ArtistMedia => Boolean(item));

  return images.length > 0 ? images : undefined;
};

const buildTimeScheduleEntries = (
  entries?: (EventTimeScheduleEntry | null)[] | null,
): Event['schedule'] => {
  if (!entries || entries.length === 0) return undefined;

  const formatted = entries
    .map((entry) => {
      if (!entry) return null;
      const { startTime, endTime, label, note } = entry;

      const timeParts = [toHourMinute(startTime), toHourMinute(endTime)].filter(
        (value): value is string => Boolean(value),
      );
      const timeLabel = timeParts.length > 0 ? timeParts.join('〜') : label ?? '時間未定';

      const activityParts = [label, note]
        .map((value) => (value ? value.trim() : ''))
        .filter((value) => value.length > 0);
      const activity = activityParts.length > 0 ? activityParts.join(' / ') : '内容未定';

      return {
        time: timeLabel,
        activity,
      } as EventScheduleEntry;
    })
    .filter((value): value is EventScheduleEntry => Boolean(value));

  return formatted.length > 0 ? formatted : undefined;
};

const buildSlotDetailEntries = (
  details?: SlotTimeDetailEntry[] | null,
): EventScheduleEntry[] | undefined => {
  if (!details || details.length === 0) return undefined;
  const normalized = details.map((detail) => {
    if (!detail) return null;
    return {
      startTime: detail.detailStartTime,
      endTime: detail.detailEndTime,
      label: detail.detailLabel,
      note: detail.detailNote,
    } satisfies EventTimeScheduleEntry;
  });
  return buildTimeScheduleEntries(normalized);
};

const buildSlotSchedules = (slots?: EventSlot[] | null): EventSlotSchedule[] | undefined => {
  if (!slots || slots.length === 0) return undefined;

  const schedules = slots
    .map((slot, index) => {
      const entries = buildSlotDetailEntries(slot.slotTimeSchedule);
      if (!entries || entries.length === 0) return null;
      const label = formatSchedule(slot) || '日程未定';
      return {
        id: `${slot.date ?? 'slot'}-${slot.startTime ?? index}`,
        label,
        entries,
      } as EventSlotSchedule;
    })
    .filter((value): value is EventSlotSchedule => Boolean(value));

  return schedules.length > 0 ? schedules : undefined;
};

const normalizeHtml = (value?: string | null) => {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeContact = (contact?: EventContact | null): EventContact | undefined => {
  if (!contact) return undefined;
  const phone = contact.phone?.trim();
  const email = contact.email?.trim();
  const formUrl = contact.formUrl?.trim();
  const reservationOverrideUrl = contact.reservationOverrideUrl?.trim();
  if (!phone && !email && !formUrl && !reservationOverrideUrl) {
    return undefined;
  }
  return {
    phone: phone || undefined,
    email: email || undefined,
    formUrl: formUrl || undefined,
    reservationOverrideUrl: reservationOverrideUrl || undefined,
  };
};

const toAbsoluteUrl = (uri?: string | null) => {
  if (!uri) return undefined;
  if (/^https?:\/\//i.test(uri)) return uri;
  const normalized = uri.startsWith('/') ? uri : `/${uri}`;
  return `https://oyakonojikanlabo.jp${normalized}`;
};

const buildArtists = (
  nodes?: Array<{
    __typename?: string | null;
    title?: string | null;
    slug?: string | null;
    name?: string | null;
    uri?: string | null;
  }> | null,
): EventArtist[] | undefined => {
  if (!nodes || nodes.length === 0) return undefined;

  const mapped = nodes
    .map((node) => {
      if (!node) return null;
      const name = node.title ?? node.name;
      if (!name) return null;
      const url = toAbsoluteUrl(node.uri ?? undefined);
      return {
        name,
        slug: node.slug ?? undefined,
        url,
      } as EventArtist;
    })
    .filter((value): value is EventArtist => Boolean(value));

  return mapped.length > 0 ? mapped : undefined;
};

const extractTexts = (
  items?: Array<{ text?: string | null } | null> | null,
): string[] | undefined => {
  if (!items || items.length === 0) return undefined;

  const texts = items
    .map((item) => item?.text?.trim())
    .filter((text): text is string => typeof text === 'string' && text.length > 0);

  return texts.length > 0 ? texts : undefined;
};

const renderMultilineText = (text: string) =>
  text.split(/\r?\n/).map((line, index, array) => (
    <React.Fragment key={`${line}-${index}`}>
      {line}
      {index < array.length - 1 ? <br /> : null}
    </React.Fragment>
  ));

const formatIsoDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

interface ParsedArtistContent {
  biographyHtml?: string;
  biographyText?: string;
  mainImage?: ArtistMedia;
  gallery?: ArtistMedia[];
  works?: string[];
  snsLinks?: ArtistSnsLink[];
}

const parseArtistContent = (content?: string | null): ParsedArtistContent => {
  if (!content) return {};
  const trimmed = content.trim();
  if (!trimmed) return {};

  const extractJsonFromHtml = (html: string) => {
    const scriptMatch = html.match(
      /<script[^>]*type=["']application\/json["'][^>]*data-artist-profile[^>]*>([\s\S]*?)<\/script>/i,
    );
    if (scriptMatch && scriptMatch[1]) {
      try {
        return JSON.parse(scriptMatch[1]) as ParsedArtistContent;
      } catch {
        return null;
      }
    }
    return null;
  };

  const coerceMediaArray = (value: unknown): ArtistMedia[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const mapped = value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const { url, src, alt } = item as Record<string, unknown>;
        const resolved = (typeof url === 'string' && url) || (typeof src === 'string' && src);
        if (!resolved) return null;
        return {
          url: resolved,
          alt: typeof alt === 'string' ? alt : undefined,
        } as ArtistMedia;
      })
      .filter((item): item is ArtistMedia => Boolean(item));
    return mapped.length > 0 ? mapped : undefined;
  };

  const coerceWorks = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const mapped = value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
    return mapped.length > 0 ? mapped : undefined;
  };

  const coerceSns = (value: unknown): ArtistSnsLink[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const mapped = value
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const { label, url, icon } = item as Record<string, unknown>;
        if (typeof label !== 'string' || typeof url !== 'string') return null;

        const link: ArtistSnsLink = {
          label: label.trim(),
          url: url.trim(),
        };

        if (typeof icon === 'string') {
          const trimmedIcon = icon.trim();
          if (trimmedIcon) {
            link.icon = trimmedIcon;
          }
        }

        return link;
      })
      .filter((item): item is ArtistSnsLink => item !== null);
    return mapped.length > 0 ? mapped : undefined;
  };

  const buildFromJson = (jsonText: string): ParsedArtistContent | null => {
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed || typeof parsed !== 'object') return null;
      const record = parsed as Record<string, unknown>;
      const mainImageValue = record.mainImage as Record<string, unknown> | undefined;
      const mainImage =
        mainImageValue && typeof mainImageValue === 'object'
          ? {
              url:
                (typeof mainImageValue.url === 'string' && mainImageValue.url) ||
                (typeof mainImageValue.src === 'string' && mainImageValue.src) ||
                '',
              alt:
                typeof mainImageValue.alt === 'string'
                  ? mainImageValue.alt
                  : typeof mainImageValue.altText === 'string'
                    ? mainImageValue.altText
                    : undefined,
            }
          : undefined;

      const biographyHtml =
        typeof record.biographyHtml === 'string' && record.biographyHtml.trim().length > 0
          ? record.biographyHtml
          : undefined;
      const biographyText =
        typeof record.biography === 'string' && record.biography.trim().length > 0
          ? record.biography
          : typeof record.biographyText === 'string' && record.biographyText.trim().length > 0
            ? record.biographyText
            : undefined;

      return {
        biographyHtml,
        biographyText,
        mainImage: mainImage?.url ? mainImage : undefined,
        gallery: coerceMediaArray(record.gallery),
        works: coerceWorks(record.works),
        snsLinks: coerceSns(record.snsLinks ?? record.socialLinks),
      };
    } catch {
      return null;
    }
  };

  const jsonFromScript = extractJsonFromHtml(trimmed);
  if (jsonFromScript) return jsonFromScript;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const jsonParsed = buildFromJson(trimmed);
    if (jsonParsed) return jsonParsed;
  }

  return { biographyHtml: trimmed };
};

const formatEvent = (node: EventNode): Event => {
  const eventCpt = node.eventCpt ?? {};
  const eventDetailExt = node.eventDetailExt;
  const primarySlot = selectPrimarySlot(eventCpt.singleSlots);
  const dateLines = buildDateLines(eventCpt.singleSlots);
  const scheduleFromExt = buildTimeScheduleEntries(eventDetailExt?.timeSchedule);
  const scheduleFromSlots = createScheduleEntries(eventCpt.singleSlots);
  const slotSchedules = buildSlotSchedules(eventCpt.singleSlots);
  const summaryHtml = normalizeHtml(eventCpt.summary);
  const detailHtml = normalizeHtml(eventDetailExt?.detailBody ?? node.content);
  const descriptionHtml = summaryHtml ?? detailHtml ?? undefined;
  const descriptionText =
    summaryHtml !== undefined ? stripHtml(summaryHtml) : stripHtml(detailHtml);
  const notes = eventCpt.notes?.trim();
  const primaryDateLabel = formatSchedule(primarySlot);
  const galleryImages = buildGalleryImages(eventDetailExt?.gallery);

  return {
    id: node.id,
    slug: node.slug ?? node.id,
    title: node.title ?? 'イベント情報',
    category: eventCpt.eventType ?? 'event',
    date: dateLines?.[0] ?? primaryDateLabel,
    dateLines,
    location: buildLocationLabel(eventCpt, node.eventRegions),
    region: node.eventRegions?.nodes?.[0]?.name ?? '地域未定',
    image: eventCpt.mainImage?.node?.sourceUrl ?? '',
    galleryImages,
    slotSchedules,
    status: determineStatus(primarySlot),
    description: descriptionText || undefined,
    descriptionHtml,
    detailHtml: detailHtml,
    timeScheduleHtml: undefined,
    price: formatPrice(eventCpt.price, eventCpt.priceType),
    capacity: formatCapacity(eventCpt.capacity),
    contact: normalizeContact(eventDetailExt?.contact),
    schedule: scheduleFromExt ?? scheduleFromSlots,
    mapUrl: eventCpt.venueMapsUrl ?? undefined,
    artists: buildArtists(eventCpt.artists?.nodes),
    benefits: extractTexts(eventDetailExt?.benefits),
    belongings: extractTexts(eventDetailExt?.belongings),
    notes: notes && notes.length > 0 ? notes : undefined,
    reservationOpen: eventCpt.reservationOpen ?? null,
  };
};

const buildFallbackEvent = (slug: string): Event => ({
  id: slug,
  slug,
  title: 'たなかしん作品展【守りたいもの】',
  category: 'author',
  date: '2025年6月8日（日） 14:00〜16:00',
  location: 'カルチャー＆ブックカフェPICO イベントスペース',
  region: '近畿',
  image: FALLBACK_EVENT_IMAGE,
  status: 'current',
  description:
    '人気絵本作家の山田太郎さんをお招きし、サイン会を開催します。新刊「もりのともだち おおきなき」の出版を記念して、読み聞かせやトークセッションも予定しています。',
  descriptionHtml:
    '<p>人気絵本作家の山田太郎さんをお招きし、サイン会を開催します。新刊「もりのともだち おおきなき」の出版を記念して、読み聞かせやトークセッションも予定しています。</p>',
  detailHtml:
    '<p>人気絵本作家の山田太郎さんをお招きし、サイン会を開催します。新刊「もりのともだち おおきなき」の出版を記念して、読み聞かせやトークセッションも予定しています。</p>',
  timeScheduleHtml:
    '<ul><li>14:00～14:15　開場・ご挨拶</li><li>14:15～14:45　新刊読み聞かせ</li><li>14:45～15:15　トークセッション</li><li>15:15～16:00　サイン会</li></ul>',
  price: '無料',
  capacity: '30名（要事前予約）',
  contact: undefined,
  mapUrl: 'https://maps.google.com',
  schedule: [
    { time: '14:00～14:15', activity: '開場・ご挨拶' },
    { time: '14:15～14:45', activity: '新刊読み聞かせ' },
    { time: '14:45～15:15', activity: 'トークセッション' },
    { time: '15:15～16:00', activity: 'サイン会' },
  ],
  artists: undefined,
  benefits: undefined,
  belongings: undefined,
  notes: undefined,
  reservationOpen: true,
});

const formatArtist = (node: ArtistNode): ArtistProfile => {
  const info = node.artistInformation;
  const parsed = parseArtistContent(node.content);

  const infoMainImage = info?.profileImage?.node?.sourceUrl
    ? {
        url: info.profileImage.node.sourceUrl,
        alt:
          info.profileImage.node.altText ??
          info?.name ??
          node.title ??
          undefined,
      }
    : undefined;

  const infoGallery = info?.thumbnails?.nodes
    ?.map((item) => {
      if (!item?.sourceUrl) return null;
      return {
        url: item.sourceUrl,
        alt: item.altText ?? info?.name ?? node.title ?? undefined,
      } as ArtistMedia;
    })
    .filter((item): item is ArtistMedia => Boolean(item));

  const fallbackImage = node.featuredImage?.node?.sourceUrl
    ? {
        url: node.featuredImage.node.sourceUrl,
        alt: node.featuredImage.node.altText ?? node.title ?? undefined,
      }
    : undefined;

  const mainImage =
    infoMainImage ??
    parsed.mainImage ??
    fallbackImage ??
    (infoGallery && infoGallery[0]) ??
    (parsed.gallery && parsed.gallery[0]);

  const gallerySources = [
    ...(infoGallery ?? []),
    ...(parsed.gallery ?? []),
  ].filter((item) => (mainImage ? item.url !== mainImage.url : true));

  const expertise = info?.expertiseFields
    ?.map((field) => (field ? field.trim() : ''))
    .filter((field) => field.length > 0);

  const snsLinks: ArtistSnsLink[] = [];

  if (info?.website) {
    snsLinks.push({
      label: '公式サイト',
      url: info.website,
      icon: 'web',
    });
  }

  if (info?.instagram) {
    snsLinks.push({
      label: 'Instagram',
      url: info.instagram,
      icon: 'instagram',
    });
  }

  if (parsed.snsLinks) {
    parsed.snsLinks.forEach((link) => {
      if (!link.url) return;
      const duplicate = snsLinks.some(
        (existing) => existing.url === link.url || existing.label === link.label,
      );
      if (!duplicate) {
        snsLinks.push(link);
      }
    });
  }

  const relatedBooks = info?.relatedBooks
    ?.map((book) => {
      if (!book) return null;
      const title = book.title?.trim();
      const publisher = book.publisher?.trim();
      const releaseDate = book.releaseDate?.trim();
      const isbn = book.isbn?.trim();
      const coverImage = book.coverImage?.node?.sourceUrl
        ? {
            url: book.coverImage.node.sourceUrl,
            alt: book.coverImage.node.altText ?? title ?? undefined,
          }
        : undefined;

      if (!title && !publisher && !releaseDate && !isbn && !coverImage) return null;
      return {
        title: title || undefined,
        publisher: publisher || undefined,
        releaseDate: releaseDate || undefined,
        isbn: isbn || undefined,
        coverImage,
      } as ArtistRelatedBook;
    })
    .filter((book): book is ArtistRelatedBook => Boolean(book));

  return {
    id: node.id,
    slug: node.slug ?? node.id,
    name: info?.name ?? node.title ?? '作家情報',
    mainImage,
    gallery: gallerySources,
    biographyHtml: parsed.biographyHtml,
    biographyText: info?.profileText ?? parsed.biographyText,
    works: parsed.works,
    snsLinks: snsLinks.length > 0 ? snsLinks : undefined,
    jobTitle: info?.title ?? undefined,
    expertise: expertise && expertise.length > 0 ? expertise : undefined,
    email: info?.email ?? undefined,
    phone: info?.phone ?? undefined,
    website: info?.website ?? undefined,
    instagram: info?.instagram ?? undefined,
    notes: info?.notes ?? undefined,
    relatedBooks,
    isActive: info?.active ?? null,
  };
};

const EventDetailPage: React.FC = () => {
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeArtistSlug, setActiveArtistSlug] = useState<string | null>(null);
  const [artistDetail, setArtistDetail] = useState<ArtistProfile | null>(null);
  const [artistLoading, setArtistLoading] = useState(false);
  const [artistError, setArtistError] = useState<string | null>(null);
  const artistCacheRef = useRef<Record<string, ArtistProfile>>({});
  const [activeArtistImageIndex, setActiveArtistImageIndex] = useState(0);
  const [activeEventImageIndex, setActiveEventImageIndex] = useState(0);
  const [usingFallback, setUsingFallback] = useState(false);
  const showMembershipFeatures = getFeatureFlag('showMembershipFeatures');

  const {
    isFavorited,
    loading: favoriteLoading,
    processing: favoriteProcessing,
    error: favoriteError,
    toggleFavorite,
  } = useFavorite({ targetType: 'event', targetId: event?.slug ?? routeSlug ?? null });

  const favoriteBusy = useMemo(
    () => favoriteLoading || favoriteProcessing,
    [favoriteLoading, favoriteProcessing],
  );

  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    const eventSlug = event?.slug ?? routeSlug;
    if (!eventSlug) {
      return 'https://oyakonojikanlabo.jp';
    }
    return `https://oyakonojikanlabo.jp/event/${eventSlug}`;
  }, [event?.slug, routeSlug]);

  const shareText = useMemo(() => {
    const title = event?.title ?? '親子の時間研究所のイベント';
    return `${title} | 親子の時間研究所`;
  }, [event?.title]);

  const hasMapUrl = Boolean(event?.mapUrl);
  const reservationOverrideUrl = event?.contact?.reservationOverrideUrl;
  const defaultReservationPath = `/event/${event?.slug ?? routeSlug ?? ''}/reserve`;
  const isExternalReservationOverride = Boolean(
    reservationOverrideUrl && /^https?:\/\//i.test(reservationOverrideUrl),
  );
  const eventImages = useMemo<ArtistMedia[]>(() => {
    if (!event) {
      return [
        {
          url: FALLBACK_EVENT_IMAGE,
          alt: 'イベント画像',
        },
      ];
    }

    const title = event.title ?? 'イベント画像';
    const candidates: ArtistMedia[] = [];

    if (event.image) {
      candidates.push({ url: event.image, alt: title });
    }

    if (event.galleryImages && event.galleryImages.length > 0) {
      candidates.push(...event.galleryImages);
    }

    const seen = new Set<string>();
    const deduped: ArtistMedia[] = [];

    candidates.forEach((image) => {
      if (!image.url) return;
      const normalized = image.url.trim();
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      deduped.push({
        url: normalized,
        alt: image.alt ?? title,
      });
    });

    if (deduped.length > 0) {
      return deduped;
    }

    return [
      {
        url: FALLBACK_EVENT_IMAGE,
        alt: title,
      },
    ];
  }, [event]);
  const activeEventImage = useMemo(() => {
    if (eventImages.length === 0) {
      return { url: FALLBACK_EVENT_IMAGE, alt: 'イベント画像' };
    }
    const safeIndex = Math.min(activeEventImageIndex, eventImages.length - 1);
    return eventImages[safeIndex] ?? eventImages[0];
  }, [activeEventImageIndex, eventImages]);
  const hasMultipleEventImages = eventImages.length > 1;

  const renderScheduleEntries = useCallback(
    (entries: EventScheduleEntry[]) => (
      <ul className="space-y-3">
        {entries.map((item, index) => (
          <li key={`${item.time}-${index}`} className="flex">
            <span className="font-bold text-primary w-24 flex-shrink-0">{item.time}</span>
            <span className="text-gray-700">{item.activity}</span>
          </li>
        ))}
      </ul>
    ),
    [],
  );

  const renderScheduleCard = useCallback(() => {
    if (!event) return null;

    const slotSchedules = event.slotSchedules;
    const hasSlotSchedules = Boolean(slotSchedules && slotSchedules.length > 0);
    const fallbackSchedule = event.schedule ?? [];
    const hasFallbackSchedule = fallbackSchedule.length > 0;

    if (!hasSlotSchedules && !event.timeScheduleHtml && !hasFallbackSchedule) {
      return null;
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">タイムスケジュール</h2>
          {hasSlotSchedules ? (
            <div className="space-y-6">
              {slotSchedules!.map((slot) => (
                <div key={slot.id}>
                  <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
                    <i className="ri-calendar-event-line text-primary"></i>
                    <span>{slot.label}</span>
                  </div>
                  <div className="mt-3 rounded-2xl bg-gray-50 p-4">
                    {renderScheduleEntries(slot.entries)}
                  </div>
                </div>
              ))}
            </div>
          ) : event.timeScheduleHtml ? (
            <div className="bg-gray-50 rounded-2xl p-4 event-rich-text">
              <div dangerouslySetInnerHTML={{ __html: event.timeScheduleHtml }} />
            </div>
          ) : hasFallbackSchedule ? (
            <div className="rounded-2xl bg-gray-50 p-4">
              {renderScheduleEntries(fallbackSchedule)}
            </div>
          ) : (
            <p className="text-gray-500">タイムスケジュールの情報は準備中です。</p>
          )}
        </div>
      </div>
    );
  }, [event, renderScheduleEntries]);

  const selectArtistProfile = useCallback((slug?: string | null) => {
    setActiveArtistImageIndex(0);
    if (!slug) {
      setActiveArtistSlug(null);
      setArtistDetail(null);
      setArtistLoading(false);
      setArtistError('作家情報が設定されていません。管理画面で作家を紐付けてください。');
      return;
    }

    setArtistError(null);
    setActiveArtistSlug(slug);

    const cached = artistCacheRef.current[slug];
    if (cached) {
      setArtistDetail(cached);
      setArtistLoading(false);
    } else {
      setArtistDetail(null);
      setArtistLoading(true);
    }
  }, []);

  const handleArtistChipClick = useCallback(
    (slug?: string | null) => {
      selectArtistProfile(slug);
    },
    [selectArtistProfile],
  );

  const handleArtistThumbnailClick = useCallback((index: number) => {
    setActiveArtistImageIndex(index);
  }, []);

  const scrollToArtistSection = useCallback(() => {
    if (typeof document === 'undefined') return;
    const section = document.getElementById('artist-profile');
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleEventImagePrev = useCallback(() => {
    setActiveEventImageIndex((prev) => {
      const total = eventImages.length;
      if (total <= 1) return 0;
      return (prev - 1 + total) % total;
    });
  }, [eventImages.length]);

  const handleEventImageNext = useCallback(() => {
    setActiveEventImageIndex((prev) => {
      const total = eventImages.length;
      if (total <= 1) return 0;
      return (prev + 1) % total;
    });
  }, [eventImages.length]);

  const handleEventThumbnailClick = useCallback((index: number) => {
    setActiveEventImageIndex(index);
  }, []);

  const eventSwipe = useSwipe({
    onSwipeLeft: handleEventImageNext,
    onSwipeRight: handleEventImagePrev,
  });

  const seoDescription = event?.descriptionHtml ?? event?.description ?? event?.detailHtml ?? undefined;
  const seoOgImage = event?.image || event?.galleryImages?.[0]?.url || undefined;

  // WordPress GraphQL からイベントデータを取得
  useEffect(() => {
    const fetchEvent = async () => {
      if (!routeSlug) {
        setError('イベントスラッグが指定されていません');
        setNotFound(true);
        setEvent(null);
        setUsingFallback(false);
        setLoading(false);
        return;
      }

      let isContentMissing = false;

      try {
        setLoading(true);
        setError(null);
        setNotFound(false);

        const data = await request<EventResponse>(endpoint, GET_EVENT_DETAIL, { slug: routeSlug });

        if (!data.event) {
          isContentMissing = true;
          throw new Error('イベントが見つかりません');
        }

        setEvent(formatEvent(data.event));
        setUsingFallback(false);
        setNotFound(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : '不明なエラーが発生しました';
        setError(message);
        console.error('Error fetching event:', err);

        if (isContentMissing) {
          setEvent(null);
          setUsingFallback(false);
          setNotFound(true); // SEO: コンテンツ不存在が確定したときだけ 404 を GA に送る
        } else if (isDevMode) {
          setEvent(buildFallbackEvent(routeSlug ?? 'fallback'));
          setUsingFallback(true);
          setNotFound(false);
        } else {
          setEvent(null);
          setUsingFallback(false);
          setNotFound(false); // 通信エラーなどは 404 と区別して計測しない
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [routeSlug]);

  useEffect(() => {
    if (notFound) {
      send404Event(); // SEO: 301 に逃げず 404 を Search Console に伝えるための専用イベント
    }
  }, [notFound]);

  useEffect(() => {
    setActiveEventImageIndex(0);
  }, [event?.id]);

  useEffect(() => {
    if (!event?.artists || event.artists.length === 0) {
      setActiveArtistSlug(null);
      setArtistDetail(null);
      setArtistLoading(false);
      setArtistError(null);
      return;
    }

    const availableSlugs = event.artists
      .map((artist) => artist.slug)
      .filter((slug): slug is string => Boolean(slug));

    if (availableSlugs.length === 0) {
      setActiveArtistSlug(null);
      setArtistDetail(null);
      setArtistLoading(false);
      setArtistError('作家情報が設定されていません。管理画面で作家を紐付けてください。');
      return;
    }

    const currentExists = activeArtistSlug
      ? event.artists.some((artist) => artist.slug === activeArtistSlug)
      : false;

    if (!currentExists) {
      selectArtistProfile(availableSlugs[0]);
    }
  }, [event?.artists, activeArtistSlug, selectArtistProfile]);

  useEffect(() => {
    if (!activeArtistSlug) return;

    const cached = artistCacheRef.current[activeArtistSlug];
    if (cached) {
      setArtistDetail(cached);
      setArtistError(null);
      setArtistLoading(false);
      setActiveArtistImageIndex(0);
      return;
    }

    let cancelled = false;

    const fetchArtist = async () => {
      try {
        setArtistLoading(true);
        setArtistError(null);
        const data = await request<ArtistResponse>(endpoint, GET_ARTIST_DETAIL, { slug: activeArtistSlug });
        if (cancelled) return;
        if (!data.artist) {
          throw new Error('作家情報が見つかりませんでした');
        }
        const formatted = formatArtist(data.artist);
        artistCacheRef.current[activeArtistSlug] = formatted;
        if (formatted.slug) {
          artistCacheRef.current[formatted.slug] = formatted;
        }
        setArtistDetail(formatted);
        setActiveArtistImageIndex(0);
      } catch (err) {
        if (cancelled) return;
        setArtistDetail(null);
        setArtistError(
          err instanceof Error ? err.message : '作家情報の取得に失敗しました。時間をおいて再度お試しください。',
        );
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

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    if (!showShareModal) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showShareModal]);

  const handleFavoriteClick = async () => {
    const result = await toggleFavorite();

    if (!result.success) {
      if (result.reason === 'auth-required') {
        alert('お気に入り機能を利用するにはログインが必要です。');
      } else if (result.reason === 'missing-target') {
        alert('お気に入り対象が正しく読み込まれていません。ページを再読み込みしてください。');
      } else {
        alert('お気に入りの更新に失敗しました。時間をおいて再度お試しください。');
      }
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleShareClick = (platform: 'x' | 'facebook' | 'line' | 'email') => {
    if (!shareUrl) return;

    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case 'x': {
        const xUrl = `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        window.open(xUrl, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'facebook': {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        window.open(facebookUrl, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'line': {
        const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}&text=${encodedText}`;
        window.open(lineUrl, '_blank', 'noopener,noreferrer');
        break;
      }
      case 'email': {
        const subject = encodeURIComponent(event?.title ?? 'イベントのご案内');
        const body = encodeURIComponent(`${shareText}\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        break;
      }
      default:
        break;
    }
  };

  const renderHeroSlider = (wrapperClassName?: string) => {
    const combinedClassName = ['w-full', wrapperClassName].filter(Boolean).join(' ');

    if (!event) {
      return (
        <div className={combinedClassName}>
          <div
            className="flex w-full items-center justify-center rounded-2xl bg-gray-100 text-gray-500"
            style={{ aspectRatio: '3 / 4' }}
          >
            情報を読み込めませんでした
          </div>
        </div>
      );
    }

    return (
      <div className={combinedClassName}>
        <div className="relative group">
          <div
            className="relative w-full overflow-hidden rounded-2xl bg-gray-50 shadow-lg"
            style={{ aspectRatio: '3 / 4', touchAction: eventSwipe.touchAction }}
            {...eventSwipe.bind}
          >
            <img
              src={activeEventImage.url}
              alt={activeEventImage.alt ?? event.title ?? 'イベント画像'}
              className="h-full w-full object-cover object-center"
            />
            {hasMultipleEventImages && (
              <>
                <button
                  type="button"
                  onClick={handleEventImagePrev}
                  aria-label="前の画像へ"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow transition hover:bg-white"
                >
                  <i className="ri-arrow-left-s-line text-2xl"></i>
                </button>
                <button
                  type="button"
                  onClick={handleEventImageNext}
                  aria-label="次の画像へ"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-gray-700 shadow transition hover:bg-white"
                >
                  <i className="ri-arrow-right-s-line text-2xl"></i>
                </button>
              </>
            )}
            {hasMultipleEventImages && (
              <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                {activeEventImageIndex + 1}/{eventImages.length}
              </div>
            )}
          </div>
          {hasMultipleEventImages && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {eventImages.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => handleEventThumbnailClick(index)}
                  className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    index === activeEventImageIndex
                      ? 'border-primary ring-2 ring-primary/40'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  aria-label={`ギャラリー画像${index + 1}を表示`}
                >
                  <img
                    src={image.url}
                    alt={image.alt ?? `${event.title ?? 'イベント'}のギャラリー画像`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      {event && (
        <Seo
          title={event.title}
          description={seoDescription}
          ogType="article"
          ogImage={seoOgImage}
        />
      )}
      <Breadcrumb
        items={[
          { label: 'HOME', to: '/' },
          { label: 'イベント', to: '/event' },
          { label: event?.title ?? '読み込み中...' },
        ]}
      />

      {/* イベント詳細ヘッダー */}
      <section className="hero-gradient py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-full md:w-1/2">
              <div className="flex flex-col gap-6">
                <div className="order-1 md:order-1">
                  <Link to="/event" className="mb-4 inline-flex items-center text-gray-600 hover:text-primary">
                    <div className="mr-1 flex h-5 w-5 items-center justify-center">
                      <i className="ri-arrow-left-line"></i>
                    </div>
                    イベント一覧に戻る
                  </Link>
                  {loading && (
                    <div className="flex items-center py-4">
                      <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                      <span className="text-gray-600">読み込み中...</span>
                    </div>
                  )}
                  {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center">
                        <i className="ri-error-warning-line mr-2 text-red-500"></i>
                        <p className="text-red-700">エラー: {error}</p>
                      </div>
                      <p className="mt-2 text-sm text-red-600">
                        {usingFallback
                          ? 'サンプルデータを表示しています。'
                          : 'イベント詳細を表示できませんでした。'}
                      </p>
                    </div>
                  )}
                  {event && (
                    <span className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                      {event.date}
                    </span>
                  )}
                </div>

                <div className="order-2 md:order-1">
                  {event ? (
                    <h1 className="text-3xl font-bold md:text-4xl">
                      {event.title}
                    </h1>
                  ) : (
                    !loading && (
                      <h1 className="text-3xl font-bold text-gray-500 md:text-4xl">
                        イベント情報を取得できませんでした
                      </h1>
                    )
                  )}
                </div>

                {renderHeroSlider('md:hidden order-3')}

                <div className="order-4 md:order-1">
                  {event ? (
                    event.descriptionHtml ? (
                      <div
                        className="event-rich-text mb-8 text-lg leading-relaxed text-gray-700"
                        dangerouslySetInnerHTML={{ __html: event.descriptionHtml }}
                      />
                    ) : (
                      <p className="mb-8 text-lg text-gray-700">
                        {event.description ||
                          '人気絵本「もりのともだち」シリーズの作者、山田太郎さんによるサイン会を開催します。'}
                      </p>
                    )
                  ) : (
                    !loading && (
                      <p className="mb-8 text-lg text-gray-700">
                        イベント詳細を取得できませんでした。時間をおいて再度お試しください。
                      </p>
                    )
                  )}
                  {event?.artists && event.artists.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                      <span className="font-semibold text-gray-800">登場作家</span>
                      <div className="flex flex-wrap gap-2">
                        {event.artists.map((artist) => {
                          const key = artist.slug ?? artist.name;
                          const isActive = artist.slug ? artist.slug === activeArtistSlug : false;
                          const hasSlug = Boolean(artist.slug);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                handleArtistChipClick(artist.slug ?? null);
                                scrollToArtistSection();
                              }}
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white ${
                                isActive ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'
                              } ${hasSlug ? '' : 'border border-dashed border-primary/40 text-primary/60'}`}
                              aria-pressed={isActive}
                            >
                              <i className="ri-user-smile-line text-base"></i>
                              <span>{artist.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="order-5 md:order-1">
                  <div className="mb-8 grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <i className="ri-calendar-line"></i>
                        </div>
                        <h3 className="font-bold text-gray-800">開催日時・連絡先</h3>
                      </div>
                      <div className="mb-2 text-gray-600 leading-relaxed">
                        {event
                          ? renderMultilineText(
                              (event.dateLines && event.dateLines.length > 0
                                ? event.dateLines
                                : [event.date]
                              ).join('\n'),
                            )
                          : loading
                            ? '読み込み中...'
                            : 'イベント情報を取得できませんでした。'}
                      </div>
                      {event?.contact ? (
                        <div className="mt-3 space-y-2 text-sm text-gray-600">
                          {event.contact.formUrl && (
                            <a
                              href={event.contact.formUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center font-medium text-primary hover:text-primary/80"
                            >
                              <i className="ri-mail-send-line mr-1"></i>
                              お問い合わせフォーム
                            </a>
                          )}
                          {event.contact.phone && (
                            <a
                              href={`tel:${event.contact.phone.replace(/[^\d+]/g, '')}`}
                              className="flex items-center gap-1 transition-colors hover:text-primary"
                            >
                              <i className="ri-phone-line text-primary"></i>
                              <span>{event.contact.phone}</span>
                            </a>
                          )}
                          {event.contact.email && (
                            <a
                              href={`mailto:${event.contact.email}`}
                              className="flex items-center gap-1 transition-colors hover:text-primary"
                            >
                              <i className="ri-mail-line text-primary"></i>
                              <span>{event.contact.email}</span>
                            </a>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <i className="ri-map-pin-line"></i>
                        </div>
                        <h3 className="font-bold text-gray-800">開催場所</h3>
                      </div>
                      <p className="mb-2 text-gray-600">
                        {event
                          ? event.location || '開催場所未定'
                          : loading
                            ? '読み込み中...'
                            : '開催場所情報を取得できませんでした'}
                      </p>
                      <a
                        href={hasMapUrl ? event?.mapUrl ?? undefined : undefined}
                        target={hasMapUrl ? '_blank' : undefined}
                        rel={hasMapUrl ? 'noopener noreferrer' : undefined}
                        className={`inline-flex items-center text-sm ${
                          hasMapUrl ? 'text-primary hover:text-primary/80' : 'cursor-not-allowed text-gray-400'
                        }`}
                      >
                        <div className="mr-1 flex h-4 w-4 items-center justify-center">
                          <i className="ri-map-2-line"></i>
                        </div>
                        {hasMapUrl ? 'Googleマップで見る' : '地図情報は準備中です'}
                      </a>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <i className="ri-money-yen-circle-line"></i>
                        </div>
                        <h3 className="font-bold text-gray-800">参加費</h3>
                      </div>
                      <div className="text-gray-600 leading-relaxed">
                        <div>
                          {event
                            ? event.price || '無料'
                            : loading
                              ? '読み込み中...'
                              : '金額情報は準備中です'}
                        </div>
                        {event?.notes ? (
                          <div className="mt-2 text-sm text-gray-600">
                            {renderMultilineText(event.notes)}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-lg bg-white p-4 shadow-sm">
                      <div className="mb-2 flex items-center">
                        <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <i className="ri-group-line"></i>
                        </div>
                        <h3 className="font-bold text-gray-800">席枠</h3>
                      </div>
                      <p className="text-gray-600">
                        {event
                          ? event.capacity || '定員未定'
                          : loading
                            ? '読み込み中...'
                            : '定員情報は準備中です'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {loading ? (
                        <span
                          className="flex flex-1 items-center justify-center rounded-button bg-primary/60 px-8 py-3 font-medium text-white"
                          aria-disabled="true"
                        >
                          <div className="mr-2 flex h-5 w-5 items-center justify-center">
                            <i className="ri-time-line"></i>
                          </div>
                          読み込み中…
                        </span>
                      ) : reservationOverrideUrl ? (
                        <a
                          href={reservationOverrideUrl}
                          target={isExternalReservationOverride ? '_blank' : undefined}
                          rel={isExternalReservationOverride ? 'noopener noreferrer' : undefined}
                          className="flex flex-1 items-center justify-center rounded-button bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary/90"
                        >
                          <div className="mr-2 flex h-5 w-5 items-center justify-center">
                            <i className="ri-calendar-check-line"></i>
                          </div>
                          予約する
                        </a>
                      ) : (
                        <Link
                          to={defaultReservationPath}
                          className="flex flex-1 items-center justify-center rounded-button bg-primary px-8 py-3 font-medium text-white transition-colors hover:bg-primary/90"
                        >
                          <div className="mr-2 flex h-5 w-5 items-center justify-center">
                            <i className="ri-calendar-check-line"></i>
                          </div>
                          予約する
                        </Link>
                      )}
                      {showMembershipFeatures && (
                        <button
                          onClick={handleFavoriteClick}
                          disabled={favoriteBusy}
                          className={`flex items-center justify-center rounded-button border border-primary px-8 py-3 font-medium text-primary transition-colors ${
                            favoriteBusy ? 'cursor-not-allowed opacity-60' : 'hover:bg-primary/5'
                          }`}
                        >
                          <div className="mr-2 flex h-5 w-5 items-center justify-center">
                            <i className={`${isFavorited ? 'ri-heart-fill' : 'ri-heart-line'}`}></i>
                          </div>
                          お気に入り
                        </button>
                      )}
                      <button
                        onClick={handleShare}
                        className={`flex items-center justify-center rounded-button border border-primary px-8 py-3 font-medium text-primary transition-colors hover:bg-primary/5 ${
                          showMembershipFeatures ? '' : 'sm:flex-1'
                        }`}
                      >
                        <div className="mr-2 flex h-5 w-5 items-center justify-center">
                          <i className="ri-share-line"></i>
                        </div>
                        シェアする
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {renderHeroSlider('hidden md:block md:w-1/2')}
          </div>
        </div>
      </section>

      {/* イベント詳細情報 */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3">
              {renderScheduleCard()}
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-100">
                  {showMembershipFeatures && favoriteError && (
                    <p className="mb-4 text-sm text-red-500" role="alert">
                      {favoriteError}
                    </p>
                  )}
                  <h2 className="text-2xl font-bold mb-4">詳細</h2>
                  {event ? (
                    <>
                      {event.detailHtml ? (
                        <article
                          className="event-rich-text"
                          dangerouslySetInnerHTML={{ __html: event.detailHtml }}
                        />
                      ) : (
                        <p className="text-gray-700 leading-relaxed">
                          {event.description ||
                            '人気絵本作家の山田太郎さんをお招きし、サイン会を開催します。新刊「もりのともだち おおきなき」の出版を記念して、絵本の読み聞かせや創作秘話のトークセッションも予定しています。'}
                        </p>
                      )}

                      {event.benefits && event.benefits.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-xl font-bold mb-3">特典</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {event.benefits.map((benefit, index) => (
                              <li key={index}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {event.belongings && event.belongings.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-xl font-bold mb-3">持ち物</h3>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {event.belongings.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    !loading && (
                      <p className="text-gray-700 leading-relaxed">
                        イベント詳細を取得できませんでした。時間をおいて再度お試しください。
                      </p>
                    )
                  )}
                </div>
              </div>

              {event?.artists && event.artists.length > 0 && (
                <ArtistProfileSection
                  artists={event.artists}
                  profile={artistDetail}
                  loading={artistLoading}
                  error={artistError}
                  activeSlug={activeArtistSlug}
                  onSelectArtist={handleArtistChipClick}
                  activeImageIndex={activeArtistImageIndex}
                  onThumbnailClick={handleArtistThumbnailClick}
                />
              )}
            </div>

            {/* サイドバー */}
            <div className="w-full md:w-1/3">
              <div className="md:sticky md:top-4">
                {/* 予約フォーム */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
                  <div className="bg-primary text-white p-4">
                    <h2 className="text-xl font-bold">予約する</h2>
                  </div>
                  <div className="p-6">
                    <div className="text-center">
                      <p className="text-gray-700 mb-6">
                        イベントの予約は専用フォームから受け付けております。<br />
                        下記のボタンから予約ページへお進みください。
                      </p>
                      {loading ? (
                        <span className="inline-flex items-center justify-center bg-primary/60 text-white px-8 py-4 font-medium rounded-button whitespace-nowrap cursor-not-allowed w-full md:w-auto">
                          <div className="w-5 h-5 flex items-center justify-center mr-2">
                            <i className="ri-time-line"></i>
                          </div>
                          読み込み中…
                        </span>
                      ) : reservationOverrideUrl ? (
                        <a
                          href={reservationOverrideUrl}
                          target={isExternalReservationOverride ? '_blank' : undefined}
                          rel={isExternalReservationOverride ? 'noopener noreferrer' : undefined}
                          className="inline-flex items-center justify-center bg-primary text-white px-8 py-4 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors w-full md:w-auto"
                        >
                          <div className="w-5 h-5 flex items-center justify-center mr-2">
                            <i className="ri-calendar-check-line"></i>
                          </div>
                          予約ページへ進む
                        </a>
                      ) : (
                        <Link
                          to={defaultReservationPath}
                          className="inline-flex items-center justify-center bg-primary text-white px-8 py-4 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors w-full md:w-auto"
                        >
                          <div className="w-5 h-5 flex items-center justify-center mr-2">
                            <i className="ri-calendar-check-line"></i>
                          </div>
                          予約ページへ進む
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* シェアモーダル */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">シェアする</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="ri-close-line ri-lg"></i>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleShareClick('x')}
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Xでシェア"
              >
                <i className="ri-twitter-x-fill ri-lg"></i>
                <span>X</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareClick('facebook')}
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="Facebookでシェア"
              >
                <i className="ri-facebook-fill ri-lg text-[#1877F2]"></i>
                <span>Facebook</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareClick('line')}
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="LINEでシェア"
              >
                <i className="ri-line-fill ri-lg text-[#06C755]"></i>
                <span>LINE</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareClick('email')}
                className="flex items-center justify-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                aria-label="メールでシェア"
              >
                <i className="ri-mail-fill ri-lg text-gray-600"></i>
                <span>メール</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};


interface ArtistProfileSectionProps {
  artists: EventArtist[];
  profile: ArtistProfile | null;
  loading: boolean;
  error: string | null;
  activeSlug: string | null;
  onSelectArtist: (slug?: string | null) => void;
  activeImageIndex: number;
  onThumbnailClick: (index: number) => void;
}

const resolveSnsIcon = (icon?: string) => {
  if (!icon) return 'ri-external-link-line';
  const normalized = icon.toLowerCase();
  if (normalized.includes('x') || normalized.includes('twitter')) return 'ri-twitter-x-line';
  if (normalized.includes('insta')) return 'ri-instagram-line';
  if (normalized.includes('face')) return 'ri-facebook-circle-line';
  if (normalized.includes('site') || normalized.includes('web')) return 'ri-global-line';
  if (normalized.includes('youtube')) return 'ri-youtube-fill';
  if (normalized.includes('note')) return 'ri-sticky-note-line';
  if (normalized.includes('mail')) return 'ri-mail-line';
  if (normalized.includes('line')) return 'ri-line-line';
  return 'ri-external-link-line';
};

const ArtistProfileSection: React.FC<ArtistProfileSectionProps> = ({
  artists,
  profile,
  loading,
  error,
  activeSlug,
  onSelectArtist,
  activeImageIndex,
  onThumbnailClick,
}) => {
  const images = profile
    ? [profile.mainImage, ...(profile.gallery ?? [])].filter(
        (item): item is ArtistMedia => Boolean(item && item.url),
      )
    : [];
  const imageCount = images.length;

  const handleArtistSwipeNext = useCallback(() => {
    if (imageCount <= 1) return;
    const next = (activeImageIndex + 1) % imageCount;
    onThumbnailClick(next);
  }, [activeImageIndex, imageCount, onThumbnailClick]);

  const handleArtistSwipePrev = useCallback(() => {
    if (imageCount <= 1) return;
    const prev = (activeImageIndex - 1 + imageCount) % imageCount;
    onThumbnailClick(prev);
  }, [activeImageIndex, imageCount, onThumbnailClick]);

  const artistSwipe = useSwipe({
    onSwipeLeft: handleArtistSwipeNext,
    onSwipeRight: handleArtistSwipePrev,
  });

  if (!artists || artists.length === 0) return null;

  const mainImage = images[activeImageIndex] ?? images[0];
  const biographyHtml =
    profile?.biographyHtml && profile.biographyHtml.trim().length > 0
      ? profile.biographyHtml
      : undefined;
  const biographyText =
    !biographyHtml && profile?.biographyText && profile.biographyText.trim().length > 0
      ? profile.biographyText
      : undefined;
  const hasNotes = Boolean(profile?.notes && profile?.notes.trim().length > 0);

  return (
    <section
      id="artist-profile"
      className="mb-10 rounded-3xl border border-orange-100 bg-gradient-to-br from-[#fff7f2] via-white to-white shadow-xl"
    >
      <div className="border-b border-orange-50 px-6 py-6 md:px-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary/80">作家プロフィール</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">イベントに登場する作家をご紹介</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {artists.map((artist) => {
              const key = artist.slug ?? artist.name;
              const hasSlug = Boolean(artist.slug);
              const isActive = hasSlug ? artist.slug === activeSlug : false;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectArtist(artist.slug ?? null)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-white/80 text-primary hover:bg-primary/10'
                  } ${hasSlug ? 'border border-transparent' : 'border border-dashed border-primary/40 text-primary/60'}`}
                  aria-pressed={isActive}
                >
                  <i className="ri-user-smile-line text-base"></i>
                  <span>{artist.name}</span>
                  {!hasSlug && <span className="text-xs font-semibold text-primary/60">未連携</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 md:px-10 md:py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            <p>作家情報を読み込み中です...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50/80 p-6 text-sm text-red-700">
            <p className="font-semibold mb-2">作家情報を取得できませんでした。</p>
            <p className="whitespace-pre-line leading-relaxed">{error}</p>
          </div>
        ) : profile ? (
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="lg:w-5/12">
              {mainImage ? (
                <div
                  className="relative w-full overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-orange-50"
                  style={{ aspectRatio: '3 / 4', touchAction: artistSwipe.touchAction }}
                  {...artistSwipe.bind}
                >
                  <img
                    src={mainImage.url}
                    alt={mainImage.alt ?? `${profile.name}の写真`}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              ) : (
                <div
                  className="flex w-full items-center justify-center rounded-2xl bg-gray-100 text-gray-400"
                  style={{ aspectRatio: '3 / 4' }}
                >
                  画像は準備中です
                </div>
              )}
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((image, index) => (
                    <button
                      key={`${image.url}-${index}`}
                      type="button"
                      onClick={() => onThumbnailClick(index)}
                      className={`group overflow-hidden rounded-xl border ${
                        index === activeImageIndex
                          ? 'border-primary shadow-md'
                          : 'border-transparent hover:border-primary/60'
                      }`}
                      aria-label={`${profile.name}の画像 ${index + 1} を表示`}
                    >
                      <img
                        src={image.url}
                        alt={image.alt ?? `${profile.name}の作品サムネイル`}
                        className="h-20 w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:w-7/12">
              <div className="mb-3 inline-flex items-center rounded-full bg-white/90 px-4 py-1 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/20">
                <i className="ri-user-smile-line mr-2 text-base"></i>
                登場作家
              </div>
              <h3 className="text-2xl font-bold text-gray-900 md:text-3xl">{profile.name}</h3>
              {profile.jobTitle && (
                <p className="mt-2 text-sm font-semibold text-primary/80">{profile.jobTitle}</p>
              )}
              {profile.isActive === false && (
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                  <i className="ri-alert-line"></i>
                  非公開ステータス
                </p>
              )}
              {profile.expertise && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.expertise.map((item, index) => (
                    <span
                      key={`${item}-${index}`}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      <i className="ri-hashtag"></i>
                      {item}
                    </span>
                  ))}
                </div>
              )}

              {biographyHtml ? (
                <div
                  className="event-rich-text mt-4 text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: biographyHtml }}
                />
              ) : biographyText ? (
                <p className="mt-4 whitespace-pre-line text-gray-700 leading-relaxed">{biographyText}</p>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white/60 p-4 text-gray-500">
                  プロフィール本文がまだ登録されていません。ACFの「プロフィール」フィールドを入力し、GraphQL 公開設定を確認してください。
                </p>
              )}

              {hasNotes && (
                <div className="mt-4 rounded-xl border border-yellow-100 bg-yellow-50/80 p-4 text-sm text-yellow-900">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <i className="ri-sticky-note-line"></i>
                    担当メモ
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{profile?.notes}</p>
                </div>
              )}

              {profile.works && profile.works.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-900">代表作</h4>
                  <ul className="mt-3 space-y-2">
                    {profile.works.map((work, index) => (
                      <li key={`${work}-${index}`} className="flex items-start gap-2 text-gray-700">
                        <i className="ri-book-open-line mt-1 text-primary"></i>
                        <span>{work}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.snsLinks && profile.snsLinks.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {profile.snsLinks.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-primary transition-colors hover:bg-primary/10"
                    >
                      <i className={`${resolveSnsIcon(link.icon)} text-lg`}></i>
                      <span className="text-sm font-medium">{link.label}</span>
                      <i className="ri-external-link-line text-xs"></i>
                    </a>
                  ))}
                </div>
              )}

              {profile.relatedBooks && profile.relatedBooks.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-bold text-gray-900">関連書籍</h4>
                  <ul className="mt-3 space-y-3">
                    {profile.relatedBooks.map((book, index) => (
                      <li
                        key={`${book.title ?? book.isbn ?? index}`}
                        className="rounded-xl border border-gray-100 bg-white/70 p-4"
                      >
                        <div className="flex gap-3">
                          {book.coverImage ? (
                            <div className="h-20 w-16 overflow-hidden rounded-lg bg-gray-100 shadow-sm">
                              <img
                                src={book.coverImage.url}
                                alt={book.coverImage.alt ?? `${book.title ?? '関連書籍'}の表紙`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : null}
                          <div className="flex-1">
                            {book.title && <p className="font-semibold text-gray-900">{book.title}</p>}
                            <div className="mt-1 space-y-1 text-sm text-gray-600">
                              {book.publisher && <p>出版社: {book.publisher}</p>}
                              {book.releaseDate && (
                                <p>発売日: {formatIsoDate(book.releaseDate) ?? book.releaseDate}</p>
                              )}
                              {book.isbn && <p>ISBN: {book.isbn}</p>}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white/80 p-6 text-gray-600">
            作家情報は現在準備中です。WordPressの「登録作家」でプロフィールを作成し、イベントに紐付けてください。
          </div>
        )}
      </div>
    </section>
  );
};

export default EventDetailPage;
