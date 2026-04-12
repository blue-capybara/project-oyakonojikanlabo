import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { gql, request } from 'graphql-request';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import Layout from '../components/Layout/Layout';
import { supabase } from '../lib/supabaseClient';
import { getFeatureFlag } from '../config/featureFlags';
import { withBase } from '../utils/paths';
import { sendEventReserveEvent } from '../lib/ga';

interface EventSlot {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface TimeSlotOption {
  label: string;
  slot: EventSlot;
}

interface EventCpt {
  summary?: string | null;
  eventType?: string | null;
  price?: number | null;
  priceType?: string | null;
  reservationOpen?: boolean | null;
  capacity?: string | number | null;
  mainImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
  singleSlots?: EventSlot[] | null;
  venueMapsUrl?: string | null;
  venueRef?: {
    nodes?: Array<{
      __typename?: string | null;
      title?: string | null;
      slug?: string | null;
    }> | null;
  } | null;
}

interface EventTimeScheduleEntry {
  startTime?: string | null;
  endTime?: string | null;
  label?: string | null;
  note?: string | null;
}

interface EventDetailExt {
  detailBody?: string | null;
  timeSchedule?: (EventTimeScheduleEntry | null)[] | null;
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

interface ScheduleEntry {
  time: string;
  activity: string;
}

interface ReservationEvent {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  region: string;
  image: string;
  summaryHtml?: string;
  summaryText?: string;
  detailHtml?: string;
  price?: string;
  capacity?: string;
  mapUrl?: string;
  schedule?: ScheduleEntry[];
  timeSlots: TimeSlotOption[];
  dateOptions?: string[];
  primarySlot?: EventSlot;
  reservationOpen?: boolean | null;
  status: 'current' | 'upcoming' | 'past';
}

interface ReservationRow {
  id: string;
  reservation_code: string;
  customer_name?: string | null;
  customer_email?: string | null;
  event_title?: string | null;
  event_date?: string | null;
  time_slot?: string | null;
  quantity?: number | null;
  status?: string | null;
  phone?: string | null;
  special_requests?: string | null;
  created_at?: string | null;
}

const endpoint = 'https://cms.oyakonojikanlabo.jp/graphql';

const GET_EVENT_DETAIL = gql`
  query GetEventDetailForReservation($slug: ID!) {
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
        timeSchedule {
          startTime
          endTime
          label
          note
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

const selectPrimarySlot = (slots?: EventSlot[] | null) => {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((slot) => slot.date) ?? slots[0];
};

const combineDateTime = (date?: string | null, time?: string | null) => {
  if (!date) return null;
  const normalizedTime = time ? (time.length === 5 ? `${time}:00` : time) : '00:00:00';
  const parsed = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const determineSlotStatus = (slot?: EventSlot): ReservationEvent['status'] => {
  const now = new Date();
  if (!slot?.date) {
    return 'upcoming';
  }

  const start = combineDateTime(slot.date, slot.startTime);
  const end = combineDateTime(slot.date, slot.endTime) ?? start;

  if (start && end) {
    if (now >= start && now <= end) return 'current';
    return now < start ? 'upcoming' : 'past';
  }

  if (start) {
    return now < start ? 'upcoming' : 'past';
  }

  return 'upcoming';
};

const determineAggregateStatus = (slots?: EventSlot[] | null): ReservationEvent['status'] => {
  if (!slots || slots.length === 0) {
    return 'upcoming';
  }

  let hasUpcoming = false;

  for (const slot of slots) {
    const slotStatus = determineSlotStatus(slot);
    if (slotStatus === 'current') {
      return 'current';
    }
    if (slotStatus === 'upcoming') {
      hasUpcoming = true;
    }
  }

  return hasUpcoming ? 'upcoming' : 'past';
};

const formatDateLabel = (date?: string | null) => {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
};

const formatTimeLabel = (time?: string | null) => {
  if (!time) return '';
  if (time.length === 5) return time;
  if (time.length === 8) return time.slice(0, 5);
  return time;
};

const formatSlotRange = (slot: EventSlot, includeDate: boolean) => {
  const dateLabel = includeDate ? formatDateLabel(slot.date) : '';
  const start = formatTimeLabel(slot.startTime);
  const end = formatTimeLabel(slot.endTime);

  const timeLabel = start ? `${start}${end ? `〜${end}` : ''}` : end ? `〜${end}` : '';

  const label = [dateLabel, timeLabel].filter(Boolean).join(' ');
  return label || null;
};

const createTimeSlots = (slots?: EventSlot[] | null): TimeSlotOption[] => {
  if (!slots || slots.length === 0) return [];
  const uniqueDates = Array.from(
    new Set(slots.map((slot) => slot.date).filter((date): date is string => Boolean(date))),
  );
  const includeDate = uniqueDates.length > 1;
  return slots
    .map((slot) => {
      const label = formatSlotRange(slot, includeDate);
      if (!label) return null;
      return { label, slot };
    })
    .filter((option): option is TimeSlotOption => Boolean(option));
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
    if (!time) return null;
    return time.length === 5 ? `${time}` : time;
  };

  const normalizedStart = normalizeTime(startTime);
  const normalizedEnd = normalizeTime(endTime);

  const timeLabel = normalizedStart
    ? `${normalizedStart}${normalizedEnd ? `〜${normalizedEnd}` : ''}`
    : (normalizedEnd ?? '');

  return [dateLabel, timeLabel].filter(Boolean).join(' ');
};

const stripHtml = (value?: string | null) => {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, '').trim();
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

const createScheduleEntries = (slots?: EventSlot[] | null): ScheduleEntry[] | undefined => {
  if (!slots || slots.length === 0) return undefined;

  return slots.map((slot, index) => ({
    time: formatSchedule(slot),
    activity: slots.length > 1 ? `第${index + 1}部` : '開催時間',
  }));
};

const buildDateOptions = (slots?: EventSlot[] | null): string[] | undefined => {
  if (!slots || slots.length === 0) return undefined;

  const labels = slots
    .map((slot) => formatSchedule(slot))
    .filter((label): label is string => Boolean(label && label.trim().length > 0));

  if (labels.length === 0) {
    return undefined;
  }

  return Array.from(new Set(labels));
};

const buildTimeScheduleEntries = (
  entries?: (EventTimeScheduleEntry | null)[] | null,
): ScheduleEntry[] | undefined => {
  if (!entries || entries.length === 0) return undefined;

  const formatted = entries
    .map((entry) => {
      if (!entry) return null;
      const { startTime, endTime, label, note } = entry;

      const timeParts = [startTime, endTime]
        .map((value) => (value ? value.trim() : ''))
        .filter((value) => value.length > 0);
      const timeLabel = timeParts.length > 0 ? timeParts.join('〜') : (label ?? '時間未定');

      const activityParts = [label, note]
        .map((value) => (value ? value.trim() : ''))
        .filter((value) => value.length > 0);
      const activity = activityParts.length > 0 ? activityParts.join(' / ') : '内容未定';

      return {
        time: timeLabel,
        activity,
      } as ScheduleEntry;
    })
    .filter((value): value is ScheduleEntry => Boolean(value));

  return formatted.length > 0 ? formatted : undefined;
};

const formatReservationDateTime = (value?: string | null) => {
  if (!value) {
    return '日程調整中';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const translateReservationStatus = (status?: string | null) => {
  switch (status) {
    case 'confirmed':
      return '確定';
    case 'cancelled':
      return 'キャンセル済み';
    case 'pending':
    default:
      return '受付中';
  }
};

const reservationStatusBadgeClass = (status?: string | null) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-700';
    case 'cancelled':
      return 'bg-red-100 text-red-600';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
};

const formatReservationEvent = (node: EventNode): ReservationEvent => {
  const eventCpt = node.eventCpt ?? {};
  const primarySlot = selectPrimarySlot(eventCpt.singleSlots);
  const summaryHtml = eventCpt.summary ?? undefined;
  const detailHtml = node.eventDetailExt?.detailBody ?? node.content ?? undefined;
  const summaryText = [summaryHtml, detailHtml, node.content]
    .map((value) => (value ? stripHtml(value) : ''))
    .find((text) => text.length > 0);
  const dateOptions = buildDateOptions(eventCpt.singleSlots);
  const status = determineAggregateStatus(eventCpt.singleSlots);

  return {
    id: node.id,
    slug: node.slug ?? node.id,
    title: node.title ?? 'イベント情報',
    date: formatSchedule(primarySlot),
    location: buildLocationLabel(eventCpt, node.eventRegions),
    region: node.eventRegions?.nodes?.[0]?.name ?? '地域未定',
    image: eventCpt.mainImage?.node?.sourceUrl ?? '',
    summaryHtml,
    summaryText,
    detailHtml,
    price: formatPrice(eventCpt.price, eventCpt.priceType),
    capacity: formatCapacity(eventCpt.capacity),
    mapUrl: eventCpt.venueMapsUrl ?? undefined,
    schedule:
      buildTimeScheduleEntries(node.eventDetailExt?.timeSchedule) ??
      createScheduleEntries(eventCpt.singleSlots),
    timeSlots: createTimeSlots(eventCpt.singleSlots),
    dateOptions,
    primarySlot,
    reservationOpen: eventCpt.reservationOpen ?? null,
    status,
  };
};

const buildFallbackEvent = (slug: string): ReservationEvent => ({
  id: slug,
  slug,
  title: 'たなかしん作品展【守りたいもの】',
  date: '2025年6月8日（日） 14:00〜16:00',
  location: 'カルチャー＆ブックカフェPICO イベントスペース',
  region: '近畿',
  image: withBase('images/readdy/30e5f268453d5644679393e8b3b473c7.jpeg'),
  summaryText:
    '人気絵本作家のたなかしんさんによる原画展示とサイン会を開催します。読み聞かせやトークセッションも予定しています。',
  detailHtml:
    '<p>人気絵本作家のたなかしんさんによる原画展示とサイン会を開催します。読み聞かせやトークセッションも予定しています。</p>',
  price: '無料',
  capacity: '30名（要事前予約）',
  mapUrl: 'https://maps.google.com',
  schedule: [
    { time: '14:00～14:15', activity: '開場・ご挨拶' },
    { time: '14:15～14:45', activity: '読み聞かせ' },
    { time: '14:45～15:15', activity: 'トークセッション' },
    { time: '15:15～16:00', activity: 'サイン会' },
  ],
  timeSlots: [
    { label: '14:00〜14:30', slot: { date: '2025-06-08', startTime: '14:00', endTime: '14:30' } },
    { label: '14:30〜15:00', slot: { date: '2025-06-08', startTime: '14:30', endTime: '15:00' } },
    { label: '15:00〜15:30', slot: { date: '2025-06-08', startTime: '15:00', endTime: '15:30' } },
    { label: '15:30〜16:00', slot: { date: '2025-06-08', startTime: '15:30', endTime: '16:00' } },
  ],
  dateOptions: [
    '2025年6月8日（日） 14:00〜14:30',
    '2025年6月8日（日） 14:30〜15:00',
    '2025年6月8日（日） 15:00〜15:30',
    '2025年6月8日（日） 15:30〜16:00',
  ],
  primarySlot: { date: '2025-06-08', startTime: '14:00', endTime: '14:30' },
  reservationOpen: true,
  status: 'upcoming',
});

const generateReservationReference = () => {
  const now = new Date();
  const stamp = `${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  const random = Math.random().toString(36).slice(-4).toUpperCase();
  return `TMP-${stamp}${random}`;
};

const EventReservationPage: React.FC = () => {
  const showMembershipFeatures = getFeatureFlag('showMembershipFeatures');
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<ReservationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [reservationComplete, setReservationComplete] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [reservationReference, setReservationReference] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [agreement, setAgreement] = useState(false);
  const [agreementError, setAgreementError] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [existingReservations, setExistingReservations] = useState<ReservationRow[]>([]);
  const [reservationsLoading, setReservationsLoading] = useState(false);
  const [reservationError, setReservationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedReservation, setCompletedReservation] = useState<ReservationRow | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      if (!routeSlug) {
        const fallback = buildFallbackEvent('fallback');
        setEvent(fallback);
        setSelectedTimeSlot(fallback.timeSlots[0]?.label ?? '');
        setError('イベントスラッグが指定されていません');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const data = await request<EventResponse>(endpoint, GET_EVENT_DETAIL, { slug: routeSlug });

        if (!data.event) {
          throw new Error('イベントが見つかりません');
        }

        const formatted = formatReservationEvent(data.event);
        setEvent(formatted);
        setSelectedTimeSlot(formatted.timeSlots[0]?.label ?? '');
      } catch (err) {
        console.error('Error fetching event reservation data:', err);
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');

        const fallback = buildFallbackEvent(routeSlug ?? 'fallback');
        setEvent(fallback);
        setSelectedTimeSlot(fallback.timeSlots[0]?.label ?? '');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [routeSlug]);

  useEffect(() => {
    const slots = event?.timeSlots ?? [];
    if (slots.length === 0) {
      setSelectedTimeSlot('');
      return;
    }

    setSelectedTimeSlot((prev) => {
      if (prev && slots.some((option) => option.label === prev)) {
        return prev;
      }
      return slots[0]?.label ?? '';
    });
  }, [event?.timeSlots]);

  const fetchReservationsForUser = useCallback(async (user: User, eventSlug: string) => {
    setReservationsLoading(true);
    const { data, error: fetchError } = await supabase
      .from('reservations')
      .select(
        'id, reservation_code, customer_name, customer_email, event_title, event_date, time_slot, quantity, status, phone, special_requests, created_at',
      )
      .eq('user_id', user.id)
      .eq('event_slug', eventSlug)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setReservationError(`予約情報の取得に失敗しました: ${fetchError.message}`);
      setExistingReservations([]);
    } else {
      setReservationError(null);
      setExistingReservations((data ?? []) as ReservationRow[]);
    }

    setReservationsLoading(false);
  }, []);

  const applyUserProfile = useCallback(
    (user: User | null) => {
      if (!user) {
        setIsLoggedIn(false);
        setCurrentUser(null);
        setProfileName('');
        setProfileEmail('');
        setExistingReservations([]);
        setCompletedReservation(null);
        setReservationReference(null);
        setReservationError(null);
        setPhone('');
        return;
      }

      setIsLoggedIn(true);
      setCurrentUser(user);

      const userEmail = user.email ?? '';
      if (userEmail) {
        setProfileEmail(userEmail);
        setLoginEmail(userEmail);
      } else {
        setProfileEmail('');
      }

      const metadata = user.user_metadata ?? {};
      const getMetadataValue = (keys: string[]) => {
        for (const key of keys) {
          const value = metadata[key];
          if (typeof value === 'string' && value.trim().length > 0) {
            return value.trim();
          }
        }
        return null;
      };

      const metadataName = typeof metadata.name === 'string' ? metadata.name.trim() : '';
      const derivedLastName = getMetadataValue(['family_name', 'last_name', 'surname']);
      const derivedFirstName = getMetadataValue(['given_name', 'first_name']);
      const fallbackName = userEmail ? userEmail.split('@')[0] : '';
      const combinedName =
        metadataName ||
        [derivedLastName, derivedFirstName].filter(Boolean).join(' ') ||
        fallbackName;
      setProfileName(combinedName);

      const derivedPhone = getMetadataValue(['phone', 'phone_number', 'tel']);
      if (derivedPhone) {
        setPhone((prev) => (prev && prev.trim().length > 0 ? prev : derivedPhone));
      }

      if (event?.slug) {
        fetchReservationsForUser(user, event.slug);
      }
    },
    [event?.slug, fetchReservationsForUser],
  );

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      applyUserProfile(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      applyUserProfile(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applyUserProfile]);

  useEffect(() => {
    if (!currentUser || !event?.slug) return;
    fetchReservationsForUser(currentUser, event.slug);
  }, [currentUser, event?.slug, fetchReservationsForUser]);

  const handleDecreaseQuantity = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncreaseQuantity = () => {
    setQuantity((prev) => Math.min(4, prev + 1));
  };

  const handleLoginSubmit = async (eventObject: FormEvent<HTMLFormElement>) => {
    eventObject.preventDefault();
    setLoginMessage('');
    setLoginLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error || !data.user) {
      setLoginMessage(`ログインに失敗しました: ${error?.message ?? '不明なエラー'}`);
      setLoginLoading(false);
      return;
    }

    const now = new Date().toISOString();
    const update = await supabase.auth.updateUser({
      data: { last_login: now },
    });

    if (update.error) {
      console.warn('last_loginの記録に失敗しました:', update.error.message);
    }

    applyUserProfile(data.user);
    setLoginPassword('');
    setLoginLoading(false);
  };

  const handleReservationSubmit = async (eventObject: FormEvent<HTMLFormElement>) => {
    eventObject.preventDefault();

    if (!currentUser) {
      setReservationError('予約を行うにはログインが必要です。');
      return;
    }

    if (!event) {
      setReservationError('イベント情報を読み込めませんでした。');
      return;
    }

    if (event.reservationOpen === false || event.status === 'past') {
      setReservationError('このイベントの申込受付は終了しました。');
      return;
    }

    if (!agreement) {
      setAgreementError(true);
      return;
    }

    const metadata = currentUser.user_metadata ?? {};
    const metadataName = typeof metadata.name === 'string' ? metadata.name.trim() : '';
    const derivedName = profileName.trim() || metadataName;
    const resolvedEmail =
      profileEmail.trim().length > 0 ? profileEmail.trim() : (currentUser.email ?? '').trim();
    if (!derivedName) {
      setReservationError(
        showMembershipFeatures
          ? 'プロフィールに氏名が登録されていません。マイページから氏名を登録してからお申し込みください。'
          : 'プロフィールに氏名が登録されていません。恐れ入りますがお問い合わせフォームよりご相談ください。',
      );
      return;
    }
    if (!resolvedEmail) {
      setReservationError(
        showMembershipFeatures
          ? 'プロフィールのメールアドレスが確認できません。マイページでメールアドレスを設定してください。'
          : 'プロフィールのメールアドレスが確認できません。恐れ入りますがお問い合わせフォームよりご連絡ください。',
      );
      return;
    }

    setAgreementError(false);
    setReservationError(null);
    setIsSubmitting(true);

    const slotOption = event.timeSlots.find((option) => option.label === selectedTimeSlot);
    const slotDate = slotOption?.slot?.date ?? event.primarySlot?.date ?? null;

    const toIsoString = (dateValue?: string | null, timeValue?: string | null) => {
      if (!dateValue) return null;
      const normalizedTime = timeValue
        ? timeValue.length === 5
          ? `${timeValue}:00`
          : timeValue
        : '00:00:00';
      const parsed = new Date(`${dateValue}T${normalizedTime}`);
      if (Number.isNaN(parsed.getTime())) {
        return null;
      }
      return parsed.toISOString();
    };

    const eventDateIso = toIsoString(
      slotDate,
      slotOption?.slot?.startTime ?? event.primarySlot?.startTime ?? null,
    );

    const eventSlug = event.slug || routeSlug || 'unknown-event';
    const reservationCode = generateReservationReference();

    try {
      const { data, error: insertError } = await supabase
        .from('reservations')
        .insert([
          {
            user_id: currentUser.id,
            customer_name: derivedName || null,
            customer_email: resolvedEmail || null,
            event_slug: eventSlug,
            event_title: event.title,
            event_date: eventDateIso,
            time_slot: selectedTimeSlot,
            quantity,
            phone,
            special_requests: specialRequests || null,
            agreement,
            reservation_code: reservationCode,
            event_location: event.location,
            event_region: event.region,
          },
        ])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const createdRecord = (data as ReservationRow | null) ?? null;
      setReservationReference(createdRecord?.reservation_code ?? reservationCode);
      setCompletedReservation(createdRecord);
      setReservationComplete(true);
      sendEventReserveEvent({ event_slug: eventSlug, event_title: event.title, quantity });
      setSpecialRequests('');
      setAgreement(true);

      await fetchReservationsForUser(currentUser, eventSlug);
    } catch (insertErr) {
      if (insertErr instanceof Error) {
        setReservationError(`予約の保存に失敗しました: ${insertErr.message}`);
      } else {
        setReservationError('予約の保存に失敗しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToDetail = () => {
    if (routeSlug) {
      navigate(`/event/${routeSlug}`);
      return;
    }
    navigate(-1);
  };

  const handleGoogleLogin = async () => {
    setLoginMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/event/${routeSlug ?? ''}/reserve`,
      },
    });

    if (error) {
      setLoginMessage(`Google認証に失敗しました: ${error.message}`);
    }
  };

  const timeSlots = event?.timeSlots ?? [];
  const defaultImage = withBase('images/readdy/30e5f268453d5644679393e8b3b473c7.jpeg');

  const displayedReservationCode =
    completedReservation?.reservation_code ?? reservationReference ?? '準備中';
  const fallbackEventDate = event?.dateOptions?.[0] ?? event?.date ?? '日程調整中';
  const displayedReservationDate = completedReservation?.event_date
    ? formatReservationDateTime(completedReservation.event_date)
    : fallbackEventDate;
  const displayedReservationTimeSlot =
    (completedReservation?.time_slot ?? selectedTimeSlot) || '調整中';
  const displayedReservationQuantity = completedReservation?.quantity ?? quantity;
  const displayedEventTitle = completedReservation?.event_title ?? event?.title ?? 'イベント情報';
  const isReservationClosed = Boolean(
    event && (event.reservationOpen === false || event.status === 'past'),
  );

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-gray-600">読み込み中です…</p>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <p className="text-center text-gray-600">イベント情報を読み込めませんでした。</p>
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={handleReturnToDetail}
              className="inline-flex items-center px-5 py-3 bg-primary text-white rounded-button hover:bg-primary/90 transition-colors"
            >
              <span className="mr-2">イベント一覧へ戻る</span>
              <i className="ri-arrow-right-line"></i>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-100 py-2">
        <div className="container mx-auto px-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-primary">
              HOME
            </Link>
            <div className="w-4 h-4 flex items-center justify-center mx-1">
              <i className="ri-arrow-right-s-line"></i>
            </div>
            <Link to="/event" className="hover:text-primary">
              イベント
            </Link>
            <div className="w-4 h-4 flex items-center justify-center mx-1">
              <i className="ri-arrow-right-s-line"></i>
            </div>
            <span className="text-primary">予約フォーム</span>
          </div>
        </div>
      </div>

      <section className="bg-white">
        <div className="container mx-auto px-4 py-10">
          <div className="bg-white shadow-sm rounded-2xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-6 md:p-10 bg-gradient-to-r from-[#FFF4EC] to-white">
              <div>
                <p className="inline-flex items-center text-sm text-primary bg-white/70 px-3 py-1 rounded-full mb-4">
                  <i className="ri-calendar-event-line mr-2"></i>
                  {event.region}
                </p>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
                {event.summaryHtml ? (
                  <div
                    className="text-gray-700 mb-6 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
                  />
                ) : event.summaryText ? (
                  <p className="text-gray-700 mb-6 leading-relaxed">{event.summaryText}</p>
                ) : (
                  <p className="text-gray-700 mb-6 leading-relaxed">
                    イベントの詳細は順次更新予定です。
                  </p>
                )}
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-start">
                    <div className="w-6 h-6 flex items-center justify-center text-primary mr-3">
                      <i className="ri-time-line"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">開催日時</p>
                      {event.dateOptions && event.dateOptions.length > 1 ? (
                        <ul className="font-medium space-y-1 mt-1">
                          {event.dateOptions.map((label) => (
                            <li key={label}>{label}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="font-medium">{event.dateOptions?.[0] ?? event.date}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-6 h-6 flex items-center justify-center text-primary mr-3">
                      <i className="ri-map-pin-line"></i>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">開催場所</p>
                      <p className="font-medium">{event.location}</p>
                    </div>
                  </div>
                  {event.price && (
                    <div className="flex items-start">
                      <div className="w-6 h-6 flex items-center justify-center text-primary mr-3">
                        <i className="ri-money-yen-circle-line"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">参加費</p>
                        <p className="font-medium">{event.price}</p>
                      </div>
                    </div>
                  )}
                  {event.capacity && (
                    <div className="flex items-start">
                      <div className="w-6 h-6 flex items-center justify-center text-primary mr-3">
                        <i className="ri-group-line"></i>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">定員</p>
                        <p className="font-medium">{event.capacity}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-2xl shadow-lg bg-white">
                  <img
                    src={event.image || defaultImage}
                    alt={event.title}
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        {error && (
          <div className="max-w-4xl mx-auto mb-6 bg-yellow-50 border border-yellow-200 text-yellow-900 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <div className="w-6 h-6 flex items-center justify-center mr-2 text-yellow-500">
                <i className="ri-alert-line"></i>
              </div>
              <div>
                <p className="font-medium">最新のイベント情報を取得できませんでした。</p>
                <p className="text-sm">表示されている内容は暫定情報の可能性があります。</p>
              </div>
            </div>
          </div>
        )}

        {isReservationClosed && (
          <div className="max-w-4xl mx-auto mb-6 bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg">
            <div className="flex items-start">
              <div className="w-6 h-6 flex items-center justify-center mr-2 text-gray-500">
                <i className="ri-close-circle-line"></i>
              </div>
              <div>
                <p className="font-medium">このイベントの申込受付は終了しました。</p>
                <p className="text-sm">
                  イベント詳細ページは引き続きご覧いただけます。最新情報は詳細ページをご確認ください。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {isReservationClosed ? (
                <div className="p-6 md:p-8 space-y-4">
                  <h2 className="text-xl font-bold">申込受付は終了しました</h2>
                  <p className="text-gray-700 leading-relaxed">
                    このイベントは終了済み、または現在は申込受付を停止しています。ページはそのまま公開していますが、この画面から新規申込はできません。
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleReturnToDetail}
                      className="inline-flex items-center px-5 py-3 bg-primary text-white rounded-button hover:bg-primary/90 transition-colors"
                    >
                      <i className="ri-arrow-left-line mr-2"></i>
                      イベント詳細に戻る
                    </button>
                    <Link
                      to="/contact"
                      className="inline-flex items-center px-5 py-3 border border-primary text-primary rounded-button hover:bg-primary/5 transition-colors"
                    >
                      お問い合わせ
                    </Link>
                  </div>
                </div>
              ) : !showMembershipFeatures ? (
                <div className="p-6 md:p-8 space-y-4">
                  <h2 className="text-xl font-bold">会員機能は準備中です</h2>
                  <p className="text-gray-700 leading-relaxed">
                    現在、ログインやマイページなどの会員向け機能はローンチ第1弾では公開を見合わせています。
                  </p>
                  <p className="text-gray-600 text-sm">
                    ご予約はこのままページ下部のフォームからお進みください。以前に会員登録済みの方も、追加の操作は不要です。
                  </p>
                </div>
              ) : !isLoggedIn ? (
                <div>
                  <div className="bg-primary text-white p-4">
                    <h2 className="text-xl font-bold">ログイン</h2>
                  </div>
                  <form onSubmit={handleLoginSubmit} className="p-6 md:p-8 space-y-5">
                    <div>
                      <label htmlFor="loginEmail" className="block text-gray-700 font-medium mb-2">
                        メールアドレス
                      </label>
                      <input
                        id="loginEmail"
                        type="email"
                        value={loginEmail}
                        onChange={(eventObject) => setLoginEmail(eventObject.target.value)}
                        className="w-full border border-gray-300 rounded-button py-3 px-4 text-gray-700"
                        placeholder="example@oyakonojikan.jp"
                        autoComplete="email"
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="loginPassword"
                        className="block text-gray-700 font-medium mb-2"
                      >
                        パスワード
                      </label>
                      <div className="relative">
                        <input
                          id="loginPassword"
                          type={showPassword ? 'text' : 'password'}
                          value={loginPassword}
                          onChange={(eventObject) => setLoginPassword(eventObject.target.value)}
                          className="w-full border border-gray-300 rounded-button py-3 px-4 pr-12 text-gray-700"
                          placeholder="8文字以上のパスワード"
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <label className="inline-flex items-center">
                        <input type="checkbox" className="rounded border-gray-300 mr-2" />
                        ログイン状態を保存
                      </label>
                      <button type="button" className="text-primary hover:text-primary/80">
                        パスワードをお忘れの方
                      </button>
                    </div>
                    {loginMessage && <p className="text-sm text-red-600">{loginMessage}</p>}
                    <button
                      type="submit"
                      className={`w-full bg-primary text-white px-6 py-3 font-medium rounded-button hover:bg-primary/90 transition-colors ${
                        loginLoading ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                      disabled={loginLoading}
                    >
                      {loginLoading ? 'ログイン中…' : 'ログイン'}
                    </button>
                    <div className="text-center text-sm text-gray-700">
                      アカウントをお持ちでない方は{' '}
                      <Link to="/signup" className="text-primary hover:text-primary/80 font-medium">
                        新規登録
                      </Link>
                    </div>
                    <div className="relative flex items-center justify-center text-gray-400 text-sm">
                      <div className="flex-grow border-t border-gray-200" />
                      <span className="px-3">または</span>
                      <div className="flex-grow border-t border-gray-200" />
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="w-full border border-gray-300 bg-white text-gray-700 px-6 py-3 font-medium rounded-button hover:bg-gray-50 transition-colors flex items-center justify-center"
                      >
                        <i className="ri-google-fill mr-2"></i>
                        Googleでログイン
                      </button>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-4 py-3 text-xs leading-relaxed">
                      ※
                      会員アカウントでログインすると、ご予約内容がマイページで確認できるようになります。
                    </div>
                  </form>
                </div>
              ) : reservationComplete ? (
                <div>
                  <div className="bg-primary text-white p-4">
                    <h2 className="text-xl font-bold">予約完了</h2>
                  </div>
                  <div className="p-6 md:p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i className="ri-check-line ri-2x text-green-500"></i>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">予約が完了しました</h3>
                    <p className="text-gray-700 mb-6">
                      ご予約ありがとうございます。確認メールはテスト環境のため送信されませんが、以下の内容を控えてください。
                    </p>
                    <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>予約番号</span>
                        <span className="font-medium text-gray-800">
                          {displayedReservationCode}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>イベント名</span>
                        <span className="font-medium text-gray-800 text-right ml-4">
                          {displayedEventTitle}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>日時</span>
                        <span className="font-medium text-gray-800 text-right ml-4">
                          {displayedReservationDate}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>参加時間帯</span>
                        <span className="font-medium text-gray-800">
                          {displayedReservationTimeSlot}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>参加人数</span>
                        <span className="font-medium text-gray-800">
                          {displayedReservationQuantity}名
                        </span>
                      </div>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 rounded-lg px-4 py-4 text-sm mb-8">
                      当日は開始15分前までにお越しください。受付では予約番号とお名前を確認させていただきます。
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      {showMembershipFeatures && (
                        <Link
                          to="/mypage"
                          className="bg-primary text-white px-6 py-3 font-medium rounded-button hover:bg-primary/90 transition-colors flex items-center justify-center"
                        >
                          <i className="ri-user-3-line mr-2"></i>
                          マイページを確認する
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={handleReturnToDetail}
                        className="border border-primary text-primary px-6 py-3 font-medium rounded-button hover:bg-primary/5 transition-colors flex items-center justify-center"
                      >
                        <i className="ri-arrow-left-line mr-2"></i>
                        イベント詳細に戻る
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-primary text-white p-4">
                    <h2 className="text-xl font-bold">イベント予約フォーム</h2>
                  </div>
                  <form onSubmit={handleReservationSubmit} className="p-6 md:p-8 space-y-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold pb-2 border-b border-gray-200">
                        お客様情報
                      </h3>
                      <div>
                        <p className="block text-gray-700 font-medium mb-2">
                          氏名 <span className="text-primary">*</span>
                        </p>
                        <div className="w-full border border-gray-200 rounded-button bg-gray-50 py-3 px-4 text-gray-700">
                          {profileName ? (
                            profileName
                          ) : showMembershipFeatures ? (
                            <span className="text-gray-500">
                              プロフィールに氏名が登録されていません。{' '}
                              <Link to="/mypage" className="text-primary underline">
                                マイページ
                              </Link>
                              から登録してください。
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              プロフィールに氏名が登録されていません。備考欄にお名前をご入力ください。
                            </span>
                          )}
                        </div>
                        {!profileName && (
                          <p className="text-xs text-gray-500 mt-1">
                            {showMembershipFeatures
                              ? '氏名を登録されるまで予約は完了できません。'
                              : '備考欄にご記入いただいた氏名をもとに担当者が手続きします。'}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="block text-gray-700 font-medium mb-2">
                          メールアドレス <span className="text-primary">*</span>
                        </p>
                        <div className="w-full border border-gray-200 rounded-button bg-gray-50 py-3 px-4 text-gray-700">
                          {profileEmail ? (
                            profileEmail
                          ) : showMembershipFeatures ? (
                            <span className="text-gray-500">
                              メールアドレスが未登録です。{' '}
                              <Link to="/mypage" className="text-primary underline">
                                マイページ
                              </Link>
                              から設定してください。
                            </span>
                          ) : (
                            <span className="text-gray-500">
                              メールアドレスが未登録です。ご連絡可能なアドレスを備考欄にご記入ください。
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {showMembershipFeatures
                            ? '確認メールを会員登録のアドレス宛にお送りします。変更はマイページから行えます。'
                            : '備考欄でご指定いただいたメールアドレス宛に確認メールをお送りします。'}
                        </p>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                          電話番号 <span className="text-primary">*</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(eventObject) => setPhone(eventObject.target.value)}
                          className="w-full border border-gray-300 rounded-button py-3 px-4 text-gray-700"
                          placeholder="090-1234-5678"
                          autoComplete="tel"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          当日連絡の取れる番号をご記入ください。
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold pb-2 border-b border-gray-200">予約内容</h3>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          参加人数 <span className="text-primary">*</span>
                        </label>
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={handleDecreaseQuantity}
                            className="w-10 h-10 border border-gray-300 rounded-l-button flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            aria-label="参加人数を1減らす"
                            disabled={isSubmitting}
                          >
                            <i className="ri-subtract-line"></i>
                          </button>
                          <input
                            id="quantity"
                            name="quantity"
                            type="number"
                            value={quantity}
                            readOnly
                            className="w-16 h-10 border-t border-b border-gray-300 text-center text-gray-700"
                          />
                          <button
                            type="button"
                            onClick={handleIncreaseQuantity}
                            className="w-10 h-10 border border-gray-300 rounded-r-button flex items-center justify-center text-gray-600 hover:bg-gray-50"
                            aria-label="参加人数を1増やす"
                            disabled={isSubmitting}
                          >
                            <i className="ri-add-line"></i>
                          </button>
                          <span className="ml-3 text-gray-700">名（最大4名まで）</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">
                          参加希望時間帯 <span className="text-primary">*</span>
                        </label>
                        {timeSlots.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {timeSlots.map(({ label }) => (
                              <label
                                key={label}
                                className={`border border-gray-300 rounded-button px-4 py-3 flex items-center cursor-pointer transition-colors ${
                                  selectedTimeSlot === label
                                    ? 'border-primary bg-primary/5'
                                    : 'hover:border-primary'
                                } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                <input
                                  type="radio"
                                  name="timeSlot"
                                  value={label}
                                  checked={selectedTimeSlot === label}
                                  onChange={() => setSelectedTimeSlot(label)}
                                  className="mr-3"
                                  disabled={isSubmitting}
                                  required
                                />
                                <span className="text-gray-700">{label}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            現在選択可能な時間帯は調整中です。後日ご案内いたします。
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="specialRequests"
                          className="block text-gray-700 font-medium mb-2"
                        >
                          その他ご要望
                        </label>
                        <textarea
                          id="specialRequests"
                          value={specialRequests}
                          onChange={(eventObject) => setSpecialRequests(eventObject.target.value)}
                          rows={4}
                          className="w-full border border-gray-300 rounded-button py-3 px-4 text-gray-700"
                          placeholder="車椅子でのご来場など、特別なご要望があればご記入ください"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-bold pb-2 border-b border-gray-200">予約規約</h3>
                      <div className="bg-gray-50 rounded-lg p-4 h-48 overflow-y-auto text-sm text-gray-700 space-y-2">
                        <p className="font-medium">以下の規約をご確認の上、ご同意ください。</p>
                        <ol className="list-decimal pl-5 space-y-2">
                          <li>予約は先着順で承ります。定員に達した場合は締め切ります。</li>
                          <li>キャンセルは前日までにメールまたはお電話でご連絡をお願いします。</li>
                          <li>
                            当日の無断欠席が続いた場合、以降のご予約をお断りする場合があります。
                          </li>
                          <li>イベント内容は予告なく変更となる可能性があります。</li>
                          <li>会場内ではスタッフの案内に従ってください。</li>
                          <li>取得した個人情報はイベント運営以外の目的には使用しません。</li>
                        </ol>
                      </div>
                      <label className="flex items-start text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={agreement}
                          onChange={(eventObject) => setAgreement(eventObject.target.checked)}
                          className="mr-3 mt-1"
                          required
                        />
                        <span>
                          上記の予約規約に同意します <span className="text-primary">*</span>
                        </span>
                      </label>
                      {agreementError && (
                        <p className="text-sm text-primary">予約規約への同意が必要です。</p>
                      )}
                    </div>

                    <div className="bg-blue-50 border border-blue-100 text-blue-700 rounded-lg px-4 py-3 text-xs leading-relaxed">
                      ※
                      送信された内容はSupabaseに保存されます。予約内容の変更・キャンセルをご希望の場合はお問い合わせください。
                    </div>

                    {reservationError && (
                      <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-4 py-3 text-sm">
                        {reservationError}
                      </div>
                    )}

                    <div className="flex justify-center">
                      <button
                        type="submit"
                        className={`bg-primary text-white px-10 py-3 font-medium rounded-button transition-colors flex items-center ${
                          isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'
                        }`}
                        disabled={isSubmitting}
                      >
                        <i className="ri-check-line mr-2"></i>
                        {isSubmitting ? '送信中…' : '予約を確定する'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {isLoggedIn && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">ご予約履歴</h3>
                  {reservationsLoading && (
                    <span className="text-sm text-gray-500">読み込み中…</span>
                  )}
                </div>
                {reservationError && !reservationComplete && (
                  <div className="bg-red-50 border border-red-100 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">
                    {reservationError}
                  </div>
                )}
                {reservationsLoading ? (
                  <p className="text-sm text-gray-500">最新の予約情報を読み込んでいます。</p>
                ) : existingReservations.length > 0 ? (
                  <ul className="space-y-4">
                    {existingReservations.map((reservation) => (
                      <li key={reservation.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">
                              予約番号
                            </p>
                            <p className="text-base font-semibold text-gray-900">
                              {reservation.reservation_code || '未発行'}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${reservationStatusBadgeClass(
                              reservation.status,
                            )}`}
                          >
                            {translateReservationStatus(reservation.status)}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
                          <div>
                            <p className="text-xs text-gray-500">日時</p>
                            <p className="font-medium">
                              {formatReservationDateTime(reservation.event_date)}
                            </p>
                            {reservation.time_slot && (
                              <p className="mt-1 text-xs text-gray-500">
                                時間帯: {reservation.time_slot}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">参加人数</p>
                            <p className="font-medium">{reservation.quantity ?? '-'}名</p>
                          </div>
                          {reservation.special_requests && (
                            <div className="sm:col-span-2">
                              <p className="text-xs text-gray-500">ご要望</p>
                              <p className="font-medium whitespace-pre-wrap">
                                {reservation.special_requests}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs text-gray-500">申込日</p>
                            <p className="font-medium">
                              {formatReservationDateTime(reservation.created_at)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    まだこのイベントの予約は登録されていません。
                  </p>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">イベント概要</h3>
              {event.detailHtml ? (
                <div
                  className="text-gray-700 leading-relaxed space-y-3"
                  dangerouslySetInnerHTML={{ __html: event.detailHtml }}
                />
              ) : event.summaryHtml ? (
                <div
                  className="text-gray-700 leading-relaxed space-y-3"
                  dangerouslySetInnerHTML={{ __html: event.summaryHtml }}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {event.summaryText || 'イベントの詳細は追ってご案内いたします。'}
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">開催情報</h3>
              <div className="flex items-start text-sm text-gray-700">
                <i className="ri-time-line text-primary mr-3 mt-0.5"></i>
                <div>
                  <p className="text-gray-500">開催日時</p>
                  {event.dateOptions && event.dateOptions.length > 1 ? (
                    <ul className="font-medium space-y-1 mt-1">
                      {event.dateOptions.map((label) => (
                        <li key={label}>{label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-medium">{event.dateOptions?.[0] ?? event.date}</p>
                  )}
                </div>
              </div>
              <div className="flex items-start text-sm text-gray-700">
                <i className="ri-map-pin-line text-primary mr-3 mt-0.5"></i>
                <div>
                  <p className="text-gray-500">開催場所</p>
                  <p className="font-medium">{event.location}</p>
                  {event.mapUrl && (
                    <a
                      href={event.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80 text-xs mt-1"
                    >
                      Googleマップで見る
                      <i className="ri-external-link-line ml-1"></i>
                    </a>
                  )}
                </div>
              </div>
              {event.price && (
                <div className="flex items-start text-sm text-gray-700">
                  <i className="ri-money-yen-circle-line text-primary mr-3 mt-0.5"></i>
                  <div>
                    <p className="text-gray-500">参加費</p>
                    <p className="font-medium">{event.price}</p>
                  </div>
                </div>
              )}
              {event.capacity && (
                <div className="flex items-start text-sm text-gray-700">
                  <i className="ri-group-line text-primary mr-3 mt-0.5"></i>
                  <div>
                    <p className="text-gray-500">定員</p>
                    <p className="font-medium">{event.capacity}</p>
                  </div>
                </div>
              )}
            </div>
            {event.schedule && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">当日の流れ</h3>
                <ul className="space-y-3 text-sm text-gray-700">
                  {event.schedule.map((entry) => (
                    <li key={`${entry.activity}-${entry.time}`} className="flex items-start">
                      <span className="text-primary font-medium mr-3">{entry.time}</span>
                      <span>{entry.activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-lg px-4 py-4">
              ご不明点は{' '}
              <Link to="/contact" className="underline text-primary hover:text-primary/80">
                お問い合わせフォーム
              </Link>{' '}
              よりお気軽にご連絡ください。
            </div>
          </aside>
        </div>
      </section>
    </Layout>
  );
};

export default EventReservationPage;
