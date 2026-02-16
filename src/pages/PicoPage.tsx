import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gql, request } from 'graphql-request';
import Layout from '../components/Layout/Layout';
import { getFeatureFlag } from '../config/featureFlags';
import { withBase } from '../utils/paths';

interface PicoEventSlot {
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface PicoVenueRefNode {
  __typename?: string | null;
  title?: string | null;
}

interface PicoEventCpt {
  summary?: string | null;
  eventType?: string | null;
  price?: number | null;
  priceType?: string | null;
  capacity?: number | string | null;
  reservationOpen?: boolean | null;
  waitlistEnabled?: boolean | null;
  displayBadges?: (string | null)[] | null;
  mainImage?: {
    node?: {
      sourceUrl?: string | null;
    } | null;
  } | null;
  singleSlots?: PicoEventSlot[] | null;
  venueRef?: {
    nodes?: Array<PicoVenueRefNode | null> | null;
  } | null;
}

interface PicoEventRegionNode {
  name?: string | null;
  slug?: string | null;
  parent?: {
    node?: PicoEventRegionNode | null;
  } | null;
}

interface PicoEventNode {
  id: string;
  slug?: string | null;
  title?: string | null;
  link?: string | null;
  eventCpt?: PicoEventCpt | null;
  eventDetailExt?: {
    detailBody?: string | null;
    contact?: {
      formUrl?: string | null;
      reservationOverrideUrl?: string | null;
    } | null;
  } | null;
  eventRegions?: {
    nodes?: Array<PicoEventRegionNode | null> | null;
  } | null;
  eventCategories?: {
    nodes?: Array<{ name?: string | null; slug?: string | null } | null> | null;
  } | null;
}

interface PicoEventResponse {
  eventCategory?: {
    events?: {
      nodes?: Array<PicoEventNode | null> | null;
    } | null;
  } | null;
}

type PicoEventType = 'event' | 'school';

interface PicoEventDisplay {
  id: string;
  slug: string;
  title: string;
  link: string;
  categorySlug: string;
  categoryLabel: string;
  categoryClassName: string;
  image: string;
  description: string;
  scheduleLabel: string;
  scheduleDateLabel: string;
  scheduleTimeLabel?: string;
  locationLabel: string;
  priceLabel: string;
  capacityLabel: string;
  statusLabel: string;
  statusClassName: string;
  ctaUrl: string;
  sortOrder: number;
  eventType: PicoEventType;
}

const GRAPHQL_ENDPOINT = 'https://cms.oyakonojikanlabo.jp/graphql';
const PICO_CATEGORY_SLUG = 'event-pico';
const MAX_PICO_EVENTS = 6;
const EVENT_IMAGE_FALLBACK = withBase('images/readdy/30e5f268453d5644679393e8b3b473c7.jpeg');

const CATEGORY_BADGES: Record<string, { label: string; className: string }> = {
  'event-pico': { label: 'PICOイベント', className: 'bg-blue-100 text-blue-800' },
  author: { label: '作家イベント', className: 'bg-red-100 text-red-800' },
  workshop: { label: 'ワークショップ', className: 'bg-yellow-100 text-yellow-800' },
  exhibition: { label: '原画展', className: 'bg-purple-100 text-purple-800' },
  lecture: { label: '講座', className: 'bg-red-100 text-red-800' },
  default: { label: 'イベント', className: 'bg-gray-100 text-gray-800' },
};

const STATUS_BADGES: Record<'current' | 'upcoming' | 'past', { label: string; className: string }> =
  {
    current: { label: '開催中', className: 'bg-sky-100 text-sky-800' },
    upcoming: { label: '開催予定', className: 'bg-green-100 text-green-800' },
    past: { label: '開催終了', className: 'bg-gray-100 text-gray-700' },
  };

const DISPLAY_BADGE_MAP: Record<string, { label: string; className: string }> = {
  open: { label: '予約受付中', className: 'bg-green-100 text-green-800' },
  few: { label: '残席わずか', className: 'bg-amber-100 text-amber-800' },
  wait: { label: 'キャンセル待ち', className: 'bg-orange-100 text-orange-800' },
  full: { label: '満席', className: 'bg-gray-200 text-gray-700' },
  closed: { label: '受付終了', className: 'bg-gray-200 text-gray-700' },
};

const GET_PICO_EVENTS = gql`
  query GetPicoEvents($first: Int!) {
    eventCategory(id: "event-pico", idType: SLUG) {
      events(first: $first, where: { orderby: { field: DATE, order: DESC } }) {
        nodes {
          id
          slug
          title
          link
          eventCategories {
            nodes {
              name
              slug
            }
          }
          eventRegions {
            nodes {
              name
              slug
              parent {
                node {
                  name
                  slug
                }
              }
            }
          }
          eventCpt {
            summary
            eventType
            price
            priceType
            capacity
            reservationOpen
            waitlistEnabled
            displayBadges
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
            contact {
              formUrl
              reservationOverrideUrl
            }
          }
        }
      }
    }
  }
`;

const isRenderableEvent = (
  node: PicoEventNode | null,
): node is PicoEventNode & { slug: string; title: string } =>
  Boolean(node && node.slug && node.title);

const selectPrimarySlot = (slots?: PicoEventSlot[] | null) => {
  if (!slots || slots.length === 0) return undefined;
  return slots.find((slot) => slot?.date) ?? slots[0] ?? undefined;
};

const normalizeTime = (time?: string | null) => {
  if (!time) return '';
  if (time.length >= 5) return time.slice(0, 5);
  return time;
};

const combineDateTime = (date?: string | null, time?: string | null) => {
  if (!date) return null;
  const normalizedTime = time ? (time.length === 5 ? `${time}:00` : time) : '00:00:00';
  const parsed = new Date(`${date.split('T')[0]}T${normalizedTime}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildScheduleParts = (slot?: PicoEventSlot) => {
  if (!slot) {
    return {
      dateLabel: '日程未定',
      timeLabel: '',
      fullLabel: '日程未定',
      sortOrder: Number.MIN_SAFE_INTEGER,
    };
  }

  const { date, startTime, endTime } = slot;
  let dateLabel = '日程未定';

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

  const startLabel = normalizeTime(startTime);
  const endLabel = normalizeTime(endTime);
  const timeLabel = startLabel ? `${startLabel}${endLabel ? `〜${endLabel}` : ''}` : endLabel;
  const fullLabel = timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
  const sortOrder = (() => {
    if (!date) return Number.MIN_SAFE_INTEGER;
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? Number.MIN_SAFE_INTEGER : parsed.getTime();
  })();

  return { dateLabel, timeLabel, fullLabel, sortOrder };
};

const determineSlotStatus = (slot?: PicoEventSlot): 'current' | 'upcoming' | 'past' => {
  if (!slot?.date) return 'upcoming';
  const now = new Date();
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

const stripHtml = (html?: string | null) => {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const truncateText = (text: string, limit = 140) => {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
};

const normalizeEventType = (value?: string | null): PicoEventType => {
  if (!value) return 'event';
  const normalized = value.trim().toLowerCase();
  if (normalized.includes('school') || value.includes('スクール')) {
    return 'school';
  }
  return 'event';
};

const buildLocationLabel = (
  eventCpt?: PicoEventCpt | null,
  regions?: PicoEventNode['eventRegions'],
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

  return '開催地未定';
};

const formatPriceLabel = (price?: number | null, priceType?: string | null) => {
  if (priceType === 'free' || price === 0) {
    return '参加費：無料';
  }
  if (typeof price === 'number' && Number.isFinite(price)) {
    return `参加費：¥${price.toLocaleString()}`;
  }
  return '参加費：詳細はイベントページへ';
};

const formatCapacityLabel = (capacity?: number | string | null) => {
  if (typeof capacity === 'number' && Number.isFinite(capacity)) {
    return `定員：${capacity}名`;
  }
  if (typeof capacity === 'string' && capacity.trim().length > 0) {
    return `定員：${capacity}`;
  }
  return '定員：未定';
};

const mapCategoryBadge = (slug?: string | null) => {
  if (!slug) return CATEGORY_BADGES.default;
  return CATEGORY_BADGES[slug] ?? CATEGORY_BADGES.default;
};

const deriveReservationBadge = (
  eventCpt: PicoEventCpt | null | undefined,
  slotStatus: 'current' | 'upcoming' | 'past',
) => {
  const badgeKey = eventCpt?.displayBadges?.find(
    (value): value is keyof typeof DISPLAY_BADGE_MAP =>
      typeof value === 'string' && value in DISPLAY_BADGE_MAP,
  );
  if (badgeKey) {
    return DISPLAY_BADGE_MAP[badgeKey];
  }
  if (eventCpt?.reservationOpen === false) {
    return DISPLAY_BADGE_MAP.closed;
  }
  if (eventCpt?.waitlistEnabled) {
    return DISPLAY_BADGE_MAP.wait;
  }
  return STATUS_BADGES[slotStatus];
};

const mapContactUrl = (node: PicoEventNode & { slug: string }) => {
  const url =
    node.eventDetailExt?.contact?.reservationOverrideUrl ?? node.eventDetailExt?.contact?.formUrl;
  if (url) return url;
  return `/event/${node.slug}`;
};

const transformEventNode = (
  node: PicoEventNode & { slug: string; title: string },
): PicoEventDisplay => {
  const eventCpt = node.eventCpt ?? null;
  const eventType = normalizeEventType(eventCpt?.eventType);
  const primarySlot = selectPrimarySlot(eventCpt?.singleSlots);
  const scheduleParts = buildScheduleParts(primarySlot);
  const statusBadge = deriveReservationBadge(eventCpt, determineSlotStatus(primarySlot));
  const categorySlug =
    node.eventCategories?.nodes?.find((item) => item?.slug)?.slug ?? PICO_CATEGORY_SLUG;
  const categoryBadge = mapCategoryBadge(categorySlug);
  const descriptionSource = eventCpt?.summary ?? node.eventDetailExt?.detailBody ?? '';

  return {
    id: node.id,
    slug: node.slug,
    title: node.title,
    link: node.link ?? `/event/${node.slug}`,
    categorySlug,
    categoryLabel: categoryBadge.label,
    categoryClassName: categoryBadge.className,
    image: eventCpt?.mainImage?.node?.sourceUrl ?? EVENT_IMAGE_FALLBACK,
    description: truncateText(stripHtml(descriptionSource)),
    scheduleLabel: scheduleParts.fullLabel,
    scheduleDateLabel: scheduleParts.dateLabel,
    scheduleTimeLabel: scheduleParts.timeLabel,
    locationLabel: buildLocationLabel(eventCpt, node.eventRegions),
    priceLabel: formatPriceLabel(eventCpt?.price, eventCpt?.priceType),
    capacityLabel: formatCapacityLabel(eventCpt?.capacity),
    statusLabel: statusBadge.label,
    statusClassName: statusBadge.className,
    ctaUrl: mapContactUrl(node),
    sortOrder: scheduleParts.sortOrder,
    eventType,
  };
};

const PicoPage: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [productSlidePosition, setProductSlidePosition] = useState(0);
  const [currentCultureSlide, setCurrentCultureSlide] = useState(0);
  const [currentRentalSlide, setCurrentRentalSlide] = useState(0);
  const [activeGalleryModal, setActiveGalleryModal] = useState(false);
  const [galleryImage, setGalleryImage] = useState({ src: '', alt: '', caption: '' });
  const instagramEmbedRef = useRef<HTMLDivElement | null>(null);
  const [picoEvents, setPicoEvents] = useState<PicoEventDisplay[]>([]);
  const [picoEventsLoading, setPicoEventsLoading] = useState(false);
  const [picoEventsError, setPicoEventsError] = useState<string | null>(null);
  const showPicoServiceSections = getFeatureFlag('showPicoServiceSections');

  const slides = [
    {
      image: withBase('images/readdy/1e2904679fa63873159fbbfd4b1d7ea0.png'),
      title: 'カルチャー＆ブックカフェPICO',
      description:
        '絵本とアートがまじわる場所で、子どもも、大人も、それぞれのたのしみ方を見つけられる。そんな、ちょっとふしぎでたのしい文化のよりどころです。',
    },
    {
      image: withBase('images/readdy/acf650eff05a08b0ffd032e5971725c4.png'),
      title: 'PICO Cafe',
      description: 'お気に入りの絵本をひらきながら、ゆっくりと、じぶんの時間をたのしめる場所です。',
    },
    {
      image: withBase('images/readdy/904b90d3b2d530f52aafb65ed5805f2f.png'),
      title: 'カルチャースクール',
      description:
        '本を読むことって、たのしい。そんな気持ちがすこしずつ育つ、子ども向けのカルチャースクールです。読書がはじめての子も、ちょっと苦手な子も、大歓迎です。',
    },
    {
      image: withBase('images/readdy/9975809614224e2a16b96d2d50b6dadd.png'),
      title: 'カルチャースクール（大人向け）',
      description:
        '大人のための、あそびとまなびの時間です。スクールやサークルをきっかけに、このまちならではの、ちょっといい交流がゆっくり育っていったらいいなと思っています。',
    },
    {
      image: withBase('images/readdy/d8bbaa7384d5faf14bf1facce84ed86d.png'),
      title: 'レンタルスペース',
      description:
        'イベントやワークショップにちょうどいいサイズの空間です。地域のみなさんが気軽につながれる場所として、ひらいています。',
    },
  ];

  const cultureSlides = [
    withBase('images/readdy/768d0223ae81cd791f14ac0c9ec38b83.jpeg'),
    withBase('images/readdy/a92976d454ad111841ae77d449541903.jpeg'),
    withBase('images/readdy/60fb80015c542130c8174108371793b6.png'),
    withBase('images/readdy/b43238d65703b6c37b252ca7691ddf63.jpeg'),
    withBase('images/readdy/ea2e67f7cd7ad82a6237bb14afc6b996.png'),
    withBase('images/readdy/6d59f191b6278f05f076af02a824279b.png'),
  ];

  const rentalSpaceSlides = [
    {
      image: withBase('images/readdy/0bc3925f6b0931bf2acc67be4c5c4761.jpeg'),
      alt: '多目的ホール',
    },
    {
      image: withBase('images/readdy/d5f99f37f8da1c02bd29b8bf789e66fa.jpeg'),
      alt: 'ワークショップルーム',
    },
    {
      image: withBase('images/readdy/de727a9192ee10451e764a6066bad34f.png'),
      alt: 'ミーティングルーム',
    },
    {
      image: withBase('images/readdy/0268ddba122497354c7a2bae31779466.png'),
      alt: '読み聞かせスペース',
    },
    {
      image: withBase('images/readdy/cf157e46a14895ba6a80016aed3fdc3c.jpeg'),
      alt: '展示スペース',
    },
    {
      image: withBase('images/readdy/81a7b07b58ab715cfa293af9b8131bb5.jpeg'),
      alt: 'セミナールーム',
    },
    {
      image: withBase('images/readdy/aef396144a9f17b34c27c940aeec4ebb.jpeg'),
      alt: 'イベントスペース',
    },
    {
      image: withBase('images/readdy/412fa2b8629800b062c2f915c951297d.jpeg'),
      alt: 'アートギャラリー',
    },
  ];

  const galleryItems = [
    {
      src: withBase('images/readdy/32f0867d8455bb477238b03689aaf21b.jpeg'),
      alt: '読書コーナー',
      caption: '読書コーナー - 子どもたちがゆったりと絵本を楽しめる空間',
    },
    {
      src: withBase('images/readdy/ca1dd2752252290d086182450434e8d2.jpeg'),
      alt: 'カフェカウンター',
      caption: 'カフェカウンター - こだわりのドリンクとスイーツをご提供',
    },
    {
      src: withBase('images/readdy/a06fb205cb0a6eef2ed56c0f14004c54.jpeg'),
      alt: 'ワークショップスペース',
      caption: 'ワークショップスペース - 創作活動のための明るい空間',
    },
    {
      src: withBase('images/readdy/775b0ba1af79b768b95870516002cc2c.jpeg'),
      alt: '絵本コーナー',
      caption: '絵本コーナー - 1,000冊以上の厳選された絵本を展示',
    },
    {
      src: withBase('images/readdy/b0f2d96bd6f22bb68ef034fb7ae985cc.jpeg'),
      alt: '原画展示スペース',
      caption: '原画展示スペース - 絵本作家の原画を定期的に展示',
    },
    {
      src: withBase('images/readdy/bdf1b76e253c2c75c267fac3cacf1fe2.jpg'),
      alt: '読み聞かせイベント',
      caption: '読み聞かせイベント - 定期的に開催される人気イベント',
    },
    {
      src: withBase('images/readdy/09d9e2a8923d0401181a98bf63f49a55.jpeg'),
      alt: '大人向けワークショップ',
      caption: '大人向けワークショップ - 創作活動を楽しむ大人のための空間',
    },
    {
      src: withBase('images/readdy/33959a9afeaf33476cf1594a702e525d.jpeg'),
      alt: 'グッズコーナー',
      caption: 'グッズコーナー - 絵本関連の素敵なグッズを多数取り揃え',
    },
  ];

  useEffect(() => {
    let slideInterval: NodeJS.Timeout;

    if (isPlaying) {
      slideInterval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 5000);
    }

    return () => {
      clearInterval(slideInterval);
    };
  }, [isPlaying, slides.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCultureSlide((prev) => (prev + 1) % cultureSlides.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [cultureSlides.length]);

  useEffect(() => {
    const container = instagramEmbedRef.current;
    if (!container) {
      return;
    }

    const patchedWindow = window as typeof window & {
      __juicerXhrPatched?: boolean;
      __juicerOriginalXhrOpen?: typeof XMLHttpRequest.prototype.open;
    };

    if (!patchedWindow.__juicerXhrPatched) {
      patchedWindow.__juicerOriginalXhrOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (
        method: string,
        url: string | URL,
        async?: boolean,
        username?: string | null,
        password?: string | null,
      ) {
        let secureUrl: string | URL = url;
        if (typeof url === 'string' && url.startsWith('http://www.juicer.io/')) {
          secureUrl = url.replace('http://', 'https://');
        } else if (url instanceof URL && url.href.startsWith('http://www.juicer.io/')) {
          secureUrl = url.href.replace('http://', 'https://');
        }

        const originalOpen = patchedWindow.__juicerOriginalXhrOpen!;
        const normalizedUrl = typeof secureUrl === 'string' ? secureUrl : secureUrl.toString();
        return originalOpen.call(
          this,
          method,
          normalizedUrl,
          async ?? true,
          username ?? undefined,
          password ?? undefined,
        );
      };
      patchedWindow.__juicerXhrPatched = true;
    }

    if (container.dataset.juicerLoaded === 'true') {
      return;
    }

    const scriptSrc = 'https://www.juicer.io/embed/ehon_salon_pico/embed-code.js';
    container.dataset.juicerLoaded = 'true';

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = scriptSrc;
    script.async = true;
    script.defer = true;

    container.appendChild(script);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchPicoEvents = async () => {
      setPicoEventsLoading(true);
      setPicoEventsError(null);

      try {
        const data = await request<PicoEventResponse>(GRAPHQL_ENDPOINT, GET_PICO_EVENTS, {
          first: MAX_PICO_EVENTS,
        });

        if (!isMounted) return;

        const nodes = data.eventCategory?.events?.nodes ?? [];
        const formatted = nodes
          .filter(isRenderableEvent)
          .map(transformEventNode)
          .sort((a, b) => b.sortOrder - a.sortOrder);

        setPicoEvents(formatted);
      } catch (error) {
        if (!isMounted) return;
        console.error('PICOイベントの取得に失敗しました:', error);
        setPicoEvents([]);
        setPicoEventsError(error instanceof Error ? error.message : 'データの取得に失敗しました');
      } finally {
        if (isMounted) {
          setPicoEventsLoading(false);
        }
      }
    };

    fetchPicoEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDotClick = (index: number) => {
    setCurrentSlide(index);
  };

  const handleRentalThumbClick = (index: number) => {
    setCurrentRentalSlide(index);
  };

  const handleGalleryClick = (item: (typeof galleryItems)[0]) => {
    setGalleryImage(item);
    setActiveGalleryModal(true);
  };

  const handleProductSlide = (direction: 'prev' | 'next') => {
    const slideWidth = 280 + 24; // Card width + gap
    const container = document.getElementById('productSlider');
    if (!container) return;

    const maxPosition = -(container.scrollWidth - container.clientWidth);

    if (direction === 'next') {
      const newPosition = Math.max(productSlidePosition - slideWidth, maxPosition);
      setProductSlidePosition(newPosition);
    } else {
      const newPosition = Math.min(productSlidePosition + slideWidth, 0);
      setProductSlidePosition(newPosition);
    }
  };

  const regularEvents = picoEvents.filter((item) => item.eventType !== 'school');
  const schoolEvents = picoEvents.filter((item) => item.eventType === 'school');
  const featuredEvent = regularEvents[0];
  const secondaryEvents = regularEvents.slice(1);
  const featuredSchoolEvent = schoolEvents[0];
  const secondarySchoolEvents = schoolEvents.slice(1);
  const shouldRenderSchoolSection =
    picoEventsLoading || Boolean(picoEventsError) || schoolEvents.length > 0;
  const isExternalUrl = (url: string) => /^https?:\/\//i.test(url);

  return (
    <Layout showNewsletter={false}>
      {/* PICOメニュー */}
      <nav className="shadow-sm relative" aria-label="PICO Menu">
        <div className="absolute inset-0 w-full h-full">
          <img
            src={withBase('images/readdy/c11c5bd65ffc1288f9376495fa609087.jpg')}
            alt="Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-white/90"></div>
        </div>
        <div className="container mx-auto px-4 relative">
          <div className="second-nav flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 py-8 md:py-0 md:h-[120px]">
            <img
              src="https://public.readdy.ai/ai/img_res/fc94a067-c501-4a16-9280-3efc791f4ae6.png"
              alt="PICO"
              className="h-16 w-auto"
            />
            <a
              href="#about"
              className="text-gray-700 hover:text-primary group relative px-4 py-2 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="font-serif text-[14px] group-hover:text-primary">PICOについて</div>
                <div className="text-xs text-gray-500 font-sans group-hover:text-primary/70">
                  About PICO
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            <a
              href="#events"
              className="text-gray-700 hover:text-primary group relative px-4 py-2 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="font-serif text-[14px] group-hover:text-primary">イベント</div>
                <div className="text-xs text-gray-500 font-sans group-hover:text-primary/70">
                  Events
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            <a
              href="#instagram"
              className="text-gray-700 hover:text-primary group relative px-4 py-2 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="font-serif text-[14px] group-hover:text-primary">
                  インスタグラム
                </div>
                <div className="text-xs text-gray-500 font-sans group-hover:text-primary/70">
                  Instagram
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
            {shouldRenderSchoolSection && (
              <a
                href="#culture-school"
                className="text-gray-700 hover:text-primary group relative px-4 py-2 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="font-serif text-[14px] group-hover:text-primary">
                    カルチャースクール
                  </div>
                  <div className="text-xs text-gray-500 font-sans group-hover:text-primary/70">
                    Culture School
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
              </a>
            )}
            {showPicoServiceSections && (
              <a
                href="#products"
                className="text-gray-700 hover:text-primary group relative px-4 py-2 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="font-serif text-[14px] group-hover:text-primary">商品</div>
                  <div className="text-xs text-gray-500 font-sans group-hover:text-primary/70">
                    Products
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
              </a>
            )}
            <a
              href="#access"
              className="text-gray-700 hover:text-primary group relative px-4 py-2 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="font-serif text-[14px] group-hover:text-primary">アクセス</div>
                <div className="text-xs text-gray-500 font-sans group-hover:text-primary/70">
                  Access
                </div>
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></div>
            </a>
          </div>
        </div>
      </nav>

      {/* メインビジュアルスライダー */}
      <section className="relative">
        <div
          className="relative w-full h-[800px] overflow-hidden"
          style={{
            backgroundImage: `url(${withBase('images/readdy/d5dd474474c2aa9ea2f3f0c8cb68cff1.png')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div id="slider" className="w-full h-full relative">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`slide absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
              >
                <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/70"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                  <h2 className="text-4xl font-bold mb-2">{slide.title}</h2>
                  <p className="text-xl max-w-2xl">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* スライダーコントロール */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full bg-white ${index === currentSlide ? 'opacity-100' : 'opacity-50'} slider-dot`}
                onClick={() => handleDotClick(index)}
              ></button>
            ))}
          </div>

          {/* 左右ナビゲーション */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-full z-10 hover:bg-black/50"
          >
            <i className="ri-arrow-left-s-line ri-lg"></i>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-full z-10 hover:bg-black/50"
          >
            <i className="ri-arrow-right-s-line ri-lg"></i>
          </button>

          {/* 再生/一時停止 */}
          <button
            onClick={togglePlayPause}
            className="absolute bottom-4 right-4 w-10 h-10 flex items-center justify-center bg-black/30 text-white rounded-full z-10 hover:bg-black/50"
          >
            <i className={`ri-${isPlaying ? 'pause' : 'play'}-line ri-lg`}></i>
          </button>
        </div>
      </section>

      {/* イベント情報セクション */}
      <section id="events" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">開催中・今後のイベント</h2>
            <Link to="/event" className="text-primary font-medium flex items-center">
              もっと見る
              <div className="w-5 h-5 flex items-center justify-center ml-1">
                <i className="ri-arrow-right-line"></i>
              </div>
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            {picoEventsLoading && !featuredEvent ? (
              <div className="p-8 flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                <span className="text-gray-500">PICOイベントを読み込み中です...</span>
              </div>
            ) : featuredEvent ? (
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2">
                  <Link to={`/event/${featuredEvent.slug}`} className="block h-full">
                    <img
                      src={featuredEvent.image}
                      alt={featuredEvent.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                </div>
                <div className="w-full md:w-1/2 p-8">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span
                      className={`inline-block px-3 py-1 text-xs rounded-full ${featuredEvent.categoryClassName}`}
                    >
                      {featuredEvent.categoryLabel}
                    </span>
                    <span
                      className={`inline-block px-3 py-1 text-xs rounded-full ${featuredEvent.statusClassName}`}
                    >
                      {featuredEvent.statusLabel}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{featuredEvent.title}</h3>
                  <div className="flex items-center text-gray-600 mb-4">
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-calendar-line"></i>
                    </div>
                    <span>{featuredEvent.scheduleLabel}</span>
                  </div>
                  <p className="text-gray-600 mb-6">
                    {featuredEvent.description || '詳細はイベント詳細ページをご確認ください。'}
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 flex items-center justify-center mr-2">
                        <i className="ri-map-pin-line"></i>
                      </div>
                      <span>{featuredEvent.locationLabel}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 flex items-center justify-center mr-2">
                        <i className="ri-money-yen-circle-line"></i>
                      </div>
                      <span>{featuredEvent.priceLabel}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <div className="w-5 h-5 flex items-center justify-center mr-2">
                        <i className="ri-group-line"></i>
                      </div>
                      <span>{featuredEvent.capacityLabel}</span>
                    </div>
                  </div>
                  {isExternalUrl(featuredEvent.ctaUrl) ? (
                    <a
                      href={featuredEvent.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors"
                    >
                      予約する
                      <i className="ri-external-link-line ml-2"></i>
                    </a>
                  ) : (
                    <Link
                      to={featuredEvent.ctaUrl}
                      className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors"
                    >
                      予約する
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-2">
                  現在、PICOタグ付きのイベントは公開されていません。
                </p>
                {picoEventsError && (
                  <p className="text-sm text-red-500">エラー: {picoEventsError}</p>
                )}
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px] border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="py-4 px-4 text-left text-gray-600 font-medium">日程</th>
                  <th className="py-4 px-4 text-left text-gray-600 font-medium">イベント名</th>
                  <th className="py-4 px-4 text-left text-gray-600 font-medium">種類</th>
                  <th className="py-4 px-4 text-left text-gray-600 font-medium">料金</th>
                  <th className="py-4 px-4 text-left text-gray-600 font-medium">予約状況</th>
                </tr>
              </thead>
              <tbody>
                {picoEventsLoading && secondaryEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      <div className="inline-flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span>一覧を準備中です...</span>
                      </div>
                    </td>
                  </tr>
                ) : secondaryEvents.length > 0 ? (
                  secondaryEvents.map((event) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        {event.scheduleDateLabel}
                        <br />
                        {event.scheduleTimeLabel || '時間未定'}
                      </td>
                      <td className="py-4 px-4 font-medium">
                        <Link to={`/event/${event.slug}`} className="hover:text-primary">
                          {event.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs rounded-full ${event.categoryClassName}`}
                        >
                          {event.categoryLabel}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {event.priceLabel}
                        <br />
                        {event.capacityLabel}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs rounded-full ${event.statusClassName}`}
                        >
                          {event.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      {picoEventsError ? (
                        <span>
                          イベント一覧の取得に失敗しました。時間をおいて再度お試しください。
                        </span>
                      ) : (
                        <span>現在表示できるイベントがありません。</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* お買いものセクション */}
      {showPicoServiceSections && (
        <section id="products" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">お買いもの</h2>
            {/* 目玉商品 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2">
                    <img
                      src={withBase(
                        'images/readdy/seq6-squarish-a-beautifully-packaged-monthly-children-s-book.jpg',
                      )}
                      alt="絵本の定期購入"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
                    <span className="inline-block bg-primary text-white px-3 py-1 text-xs rounded-full mb-3">
                      人気No.1
                    </span>
                    <h3 className="text-xl font-bold mb-3">絵本の定期購入サービス</h3>
                    <p className="text-gray-600 mb-4">
                      毎月、お子さまの年齢に合わせた厳選絵本をお届け。専門スタッフが選書するので、新しい絵本との出会いが広がります。
                    </p>
                    <div className="flex items-center mb-4">
                      <span className="text-2xl font-bold text-primary mr-2">¥2,750</span>
                      <span className="text-sm text-gray-500">(税込)/月</span>
                    </div>
                    <button className="bg-primary text-white px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors">
                      詳細を見る
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2">
                    <img
                      src={withBase(
                        'images/readdy/seq7-squarish-a-premium-children-s-book-subscription-box.jpg',
                      )}
                      alt="絵本の定期購入2"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full md:w-1/2 p-6 flex flex-col justify-center">
                    <span className="inline-block bg-secondary text-white px-3 py-1 text-xs rounded-full mb-3">
                      0〜3歳向け
                    </span>
                    <h3 className="text-xl font-bold mb-3">赤ちゃん絵本の定期購入</h3>
                    <p className="text-gray-600 mb-4">
                      0〜3歳の発達に合わせた絵本を毎月お届け。丈夫な布絵本や知育要素を含んだ絵本など、成長に寄り添う選書です。
                    </p>
                    <div className="flex items-center mb-4">
                      <span className="text-2xl font-bold text-primary mr-2">¥2,200</span>
                      <span className="text-sm text-gray-500">(税込)/月</span>
                    </div>
                    <button className="bg-primary text-white px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors">
                      詳細を見る
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 商品スライダー */}
            <div className="relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">おすすめ商品</h3>
                <Link to="/products" className="text-primary font-medium flex items-center">
                  商品を見る
                  <div className="w-5 h-5 flex items-center justify-center ml-1">
                    <i className="ri-arrow-right-line"></i>
                  </div>
                </Link>
              </div>
              <div className="overflow-hidden touch-pan-x">
                <div
                  id="productSlider"
                  className="flex transition-transform duration-300 space-x-6 cursor-grab active:cursor-grabbing"
                  style={{ transform: `translateX(${productSlidePosition}px)` }}
                >
                  <div className="min-w-[280px] bg-white rounded-lg shadow-md overflow-hidden">
                    <img
                      src={withBase(
                        'images/readdy/seq8-squarish-a-set-of-colorful-children-s-socks.jpg',
                      )}
                      alt="キャラクター靴下"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-bold mb-2">キャラクター靴下セット</h4>
                      <p className="text-gray-600 text-sm mb-3">
                        人気絵本キャラクターの靴下3足セット
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">¥1,980</span>
                        <button className="bg-primary text-white px-4 py-2 text-sm rounded-button whitespace-nowrap">
                          カートに入れる
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[280px] bg-white rounded-lg shadow-md overflow-hidden">
                    <img
                      src={withBase(
                        'images/readdy/seq9-squarish-a-children-s-book-tote-bag-with.jpg',
                      )}
                      alt="絵本トートバッグ"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-bold mb-2">絵本トートバッグ</h4>
                      <p className="text-gray-600 text-sm mb-3">
                        お気に入りの絵本を持ち運べる丈夫なキャンバス地
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">¥2,750</span>
                        <button className="bg-primary text-white px-4 py-2 text-sm rounded-button whitespace-nowrap">
                          カートに入れる
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[280px] bg-white rounded-lg shadow-md overflow-hidden">
                    <img
                      src={withBase(
                        'images/readdy/seq10-squarish-a-wooden-puzzle-toy-for-children.jpg',
                      )}
                      alt="木製パズル"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-bold mb-2">木製パズル「森の動物たち」</h4>
                      <p className="text-gray-600 text-sm mb-3">
                        人気絵本の世界観を再現した木製知育パズル
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">¥3,300</span>
                        <button className="bg-primary text-white px-4 py-2 text-sm rounded-button whitespace-nowrap">
                          カートに入れる
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[280px] bg-white rounded-lg shadow-md overflow-hidden">
                    <img
                      src={withBase(
                        'images/readdy/seq11-squarish-a-children-s-art-print-from-a.jpg',
                      )}
                      alt="アートプリント"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-bold mb-2">絵本アートプリント</h4>
                      <p className="text-gray-600 text-sm mb-3">
                        人気絵本作家の複製原画（額装済み）
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">¥8,800</span>
                        <button className="bg-primary text-white px-4 py-2 text-sm rounded-button whitespace-nowrap">
                          カートに入れる
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-[280px] bg-white rounded-lg shadow-md overflow-hidden">
                    <img
                      src={withBase(
                        'images/readdy/seq12-squarish-a-children-s-book-with-a-special.jpg',
                      )}
                      alt="サイン本"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <h4 className="font-bold mb-2">「くまくんのぼうけん」サイン本</h4>
                      <p className="text-gray-600 text-sm mb-3">
                        著者・佐藤まりこさん直筆サイン入り限定版
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary">¥1,980</span>
                        <button className="bg-primary text-white px-4 py-2 text-sm rounded-button whitespace-nowrap">
                          カートに入れる
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* スライダーコントロール */}
              <button
                onClick={() => handleProductSlide('prev')}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white text-gray-800 rounded-full shadow-md z-10 hover:bg-gray-100"
              >
                <i className="ri-arrow-left-s-line ri-lg"></i>
              </button>
              <button
                onClick={() => handleProductSlide('next')}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white text-gray-800 rounded-full shadow-md z-10 hover:bg-gray-100"
              >
                <i className="ri-arrow-right-s-line ri-lg"></i>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Instagram最新投稿 */}
      <section id="instagram" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 flex items-center justify-center text-primary mr-2">
              <i className="ri-instagram-line ri-lg"></i>
            </div>
            <h2 className="text-3xl font-bold">えほんサロンPICOのInstagram</h2>
            <a
              href="https://www.instagram.com/ehon_salon_pico"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 text-gray-600 hover:text-primary"
            >
              @ehon_salon_pico
            </a>
          </div>
          <div ref={instagramEmbedRef} className="juicer-feed-wrapper mt-6">
            <noscript>Instagramフィードを見るにはJavaScriptを有効にしてください。</noscript>
          </div>
          <div className="mt-8 text-center">
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:underline"
            >
              Instagramでもっと見る
              <div className="w-5 h-5 flex items-center justify-center ml-1">
                <i className="ri-external-link-line"></i>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* 施設概要セクション */}
      <section id="about" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">PICOについて</h2>
          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2">
                  <img
                    src={withBase('images/readdy/4d75a49af6fc29ff5c1b0b5c783a3be8.jpeg')}
                    alt="PICO豊中 外観"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-full md:w-1/2 p-8">
                  <div className="mb-8">
                    <img
                      src={withBase('images/readdy/39e5fc488b56e7ee83d85b9a01bb3b4c.png')}
                      alt="PICO Logo"
                      className="h-24 w-auto mx-auto"
                    />
                  </div>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    絵本とアートを通じて、
                    <br />
                    子どもから大人までがたのしめる
                    <br />
                    "ちいさな発見のある場所"です。
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    1,000冊をこえる絵本や児童書がずらり。
                    <br />
                    えほんにくわしいスタッフがえらんだ本たちを、
                    <br />
                    カフェのなかでゆっくり読むこともできます。
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed mb-6">
                    店内には、人気作家さんとつくったコラボグッズや、
                    <br />
                    ちょっとめずらしい絵本雑貨もいろいろ。
                    <br />
                    子ども向けのスクール、大人が夢中になるカルチャー講座、
                    <br />
                    地域のイベントがひらけるレンタルルームもあって、
                    <br />
                    たのしみ方はいろいろです。
                  </p>
                  <p className="text-lg text-gray-700 leading-relaxed">
                    思いがけない本に出会えたり、
                    <br />
                    新しいじぶんを見つけたり。
                    <br />
                    そんなきっかけが、ここにはあるかもしれません。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* サービス詳細セクション：絵本サロン＆カフェ */}
      <section id="salon" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 flex items-center justify-center text-primary mr-3">
              <i className="ri-book-open-line ri-lg"></i>
            </div>
            <h2 className="text-3xl font-bold">絵本サロン＆カフェ</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                絵本にくわしいスタッフがえらんだ、1,000冊以上の絵本と児童書をご用意しています。
                お子さんにぴったりの一冊を、いっしょに探すお手伝いもしています。
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                併設のカフェでは、お気に入りの絵本を手に取りながら、フリードリンクでひと息。
                親子でのんびり過ごせる、やわらかな空間づくりをたいせつにしています。
              </p>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-lg mb-3">取り扱いジャンル</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2">
                      <i className="ri-checkbox-circle-line"></i>
                    </div>
                    <span>絵本・児童書</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2">
                      <i className="ri-checkbox-circle-line"></i>
                    </div>
                    <span>知育玩具</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2">
                      <i className="ri-checkbox-circle-line"></i>
                    </div>
                    <span>しかけ絵本</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2">
                      <i className="ri-checkbox-circle-line"></i>
                    </div>
                    <span>絵本グッズ</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2">
                      <i className="ri-checkbox-circle-line"></i>
                    </div>
                    <span>アート絵本</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2">
                      <i className="ri-checkbox-circle-line"></i>
                    </div>
                    <span>季節の絵本</span>
                  </div>
                </div>
              </div>
              <div className="hidden bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-lg mb-3">フリードリンク代</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex justify-between items-center">
                    <span>大人</span>
                    <span className="font-medium">¥550</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>小学生</span>
                    <span className="font-medium">¥275</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>3歳～未就学</span>
                    <span className="font-medium">¥110</span>
                  </li>
                  <li className="flex justify-between items-center">
                    <span>0～2歳</span>
                    <span className="font-medium">無料</span>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-gray-600">
                  ※作家コラボのスイーツや季節のスイーツもご用意している場合がございます。（詳しくはInstagramをご確認ください）
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <img
                src={withBase('images/readdy/93b794220e208d440430c6f4f6844e28.png')}
                alt="絵本サロン内観"
                className="w-full rounded-lg shadow-md"
              />
              <img
                src={withBase('images/pico/pico-cafe-menu.png')}
                alt="カフェメニュー"
                className="w-full rounded-lg shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* カルチャースクール（スクール種別イベント） */}
      {shouldRenderSchoolSection && (
        <section id="culture-school" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold">カルチャースクール</h2>
              <Link to="/culture-school" className="text-primary font-medium flex items-center">
                スクール一覧へ
                <div className="w-5 h-5 flex items-center justify-center ml-1">
                  <i className="ri-arrow-right-line"></i>
                </div>
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
              {picoEventsLoading && !featuredSchoolEvent ? (
                <div className="p-8 flex items-center justify-center space-x-3">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                  <span className="text-gray-500">カルチャースクール情報を読み込み中です...</span>
                </div>
              ) : featuredSchoolEvent ? (
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2">
                    <Link
                      to={`/school-detail/${featuredSchoolEvent.slug}`}
                      className="block h-full"
                    >
                      <img
                        src={featuredSchoolEvent.image}
                        alt={featuredSchoolEvent.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                  </div>
                  <div className="w-full md:w-1/2 p-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full ${featuredSchoolEvent.categoryClassName}`}
                      >
                        {featuredSchoolEvent.categoryLabel}
                      </span>
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full ${featuredSchoolEvent.statusClassName}`}
                      >
                        {featuredSchoolEvent.statusLabel}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{featuredSchoolEvent.title}</h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <div className="w-5 h-5 flex items-center justify-center mr-2">
                        <i className="ri-calendar-line"></i>
                      </div>
                      <span>{featuredSchoolEvent.scheduleLabel}</span>
                    </div>
                    <p className="text-gray-600 mb-6">
                      {featuredSchoolEvent.description ||
                        '詳細はスクール詳細ページをご確認ください。'}
                    </p>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600">
                        <div className="w-5 h-5 flex items-center justify-center mr-2">
                          <i className="ri-map-pin-line"></i>
                        </div>
                        <span>{featuredSchoolEvent.locationLabel}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <div className="w-5 h-5 flex items-center justify-center mr-2">
                          <i className="ri-money-yen-circle-line"></i>
                        </div>
                        <span>{featuredSchoolEvent.priceLabel}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <div className="w-5 h-5 flex items-center justify-center mr-2">
                          <i className="ri-group-line"></i>
                        </div>
                        <span>{featuredSchoolEvent.capacityLabel}</span>
                      </div>
                    </div>
                    {isExternalUrl(featuredSchoolEvent.ctaUrl) ? (
                      <a
                        href={featuredSchoolEvent.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors"
                      >
                        申し込む
                        <i className="ri-external-link-line ml-2"></i>
                      </a>
                    ) : (
                      <Link
                        to={featuredSchoolEvent.ctaUrl}
                        className="inline-flex items-center justify-center bg-primary text-white px-6 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors"
                      >
                        申し込む
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-600 mb-2">
                    現在、PICOタグ付きのスクールは公開されていません。
                  </p>
                  {picoEventsError && (
                    <p className="text-sm text-red-500">エラー: {picoEventsError}</p>
                  )}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[768px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="py-4 px-4 text-left text-gray-600 font-medium">日程</th>
                    <th className="py-4 px-4 text-left text-gray-600 font-medium">スクール名</th>
                    <th className="py-4 px-4 text-left text-gray-600 font-medium">種類</th>
                    <th className="py-4 px-4 text-left text-gray-600 font-medium">料金</th>
                    <th className="py-4 px-4 text-left text-gray-600 font-medium">受付状況</th>
                  </tr>
                </thead>
                <tbody>
                  {picoEventsLoading && secondarySchoolEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        <div className="inline-flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <span>スクール一覧を準備中です...</span>
                        </div>
                      </td>
                    </tr>
                  ) : secondarySchoolEvents.length > 0 ? (
                    secondarySchoolEvents.map((event) => (
                      <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4">
                          {event.scheduleDateLabel}
                          <br />
                          {event.scheduleTimeLabel || '時間未定'}
                        </td>
                        <td className="py-4 px-4 font-medium">
                          <Link to={`/school-detail/${event.slug}`} className="hover:text-primary">
                            {event.title}
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-3 py-1 text-xs rounded-full ${event.categoryClassName}`}
                          >
                            {event.categoryLabel}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {event.priceLabel}
                          <br />
                          {event.capacityLabel}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`inline-block px-3 py-1 text-xs rounded-full ${event.statusClassName}`}
                          >
                            {event.statusLabel}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        {picoEventsError ? (
                          <span>
                            スクール一覧の取得に失敗しました。時間をおいて再度お試しください。
                          </span>
                        ) : (
                          <span>現在表示できるスクールがありません。</span>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
      {/* サービス詳細セクション：カルチャースクール */}
      {showPicoServiceSections && (
        <section id="culture" className="py-16 bg-white scroll-mt-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center mb-8">
              <div className="w-8 h-8 flex items-center justify-center text-primary mr-3">
                <i className="ri-palette-line ri-lg"></i>
              </div>
              <h2 className="text-3xl font-bold">カルチャースクール</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
              <div>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  「好きなことを、もっと楽しみたい」
                  <br />
                  「新しいことにチャレンジしてみたい」
                  <br />
                  「自分らしさを、見つけてみたい」
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  そんな気持ちを応援する、ちょっとユニークで、なんだか気になる講座やイベントを
                  <br />
                  PICOではいろいろひらいています。
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  経験なんて、なくても大丈夫。
                  <br />
                  思い立ったときに、自分のペースで気軽に参加できます。
                </p>
                <p className="text-lg text-gray-700 leading-relaxed mb-6">
                  まずは、ふらっと見学にきてみませんか？
                  <br />
                  新しい出会いや、思いがけない発見が、きっと待っています。
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {cultureSlides.map((slide, index) => (
                    <div
                      key={index}
                      className="aspect-[3/4.2] rounded-lg overflow-hidden shadow-sm"
                    >
                      <img
                        src={slide}
                        alt={`カルチャースクール画像${index + 1}`}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div
                  id="cultureSlider"
                  className="w-full h-[840px] relative overflow-hidden rounded-lg shadow-md"
                >
                  {cultureSlides.map((slide, index) => (
                    <img
                      key={index}
                      src={slide}
                      alt={`カルチャースクール画像${index + 1}`}
                      className={`w-full h-full object-cover absolute transition-opacity duration-1000 ${index === currentCultureSlide ? 'opacity-100' : 'opacity-0'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center">
              <Link to="/culture-school">
                <button className="bg-primary text-white px-8 py-3 font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors">
                  詳しくみる
                </button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 営業時間・アクセスセクション */}
      <section id="access" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">営業時間・アクセス</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <div className="w-6 h-6 flex items-center justify-center text-primary mr-2">
                  <i className="ri-time-line"></i>
                </div>
                営業時間・お問い合わせ
              </h3>
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <p className="text-gray-700 mb-4">営業時間は季節、時期によって異なります。</p>
                <a
                  href="https://maps.app.goo.gl/sPreNhwogKR3nYRKA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
                >
                  <span>営業時間はこちらからご確認ください</span>
                  <div className="w-5 h-5 flex items-center justify-center ml-1">
                    <i className="ri-external-link-line"></i>
                  </div>
                </a>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h4 className="font-bold mb-3">お問い合わせ</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2 mt-0.5">
                      <i className="ri-phone-line"></i>
                    </div>
                    <span>
                      <a href="tel:06-7654-7069" className="hover:text-primary">
                        TEL: 06-7654-7069
                      </a>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2 mt-0.5">
                      <i className="ri-mail-line"></i>
                    </div>
                    <span>
                      <Link to="/contact-pico" className="hover:text-primary">
                        お問い合わせフォーム
                      </Link>
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="space-y-2">
                      <a
                        href="https://www.instagram.com/culture_bookcafe_pico"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary flex items-center"
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-primary mr-1">
                          <i className="ri-instagram-line"></i>
                        </div>
                        @culture_bookcafe_pico
                        <span className="text-sm text-gray-500 ml-2">- スクール・イベント情報</span>
                      </a>
                      <a
                        href="https://www.instagram.com/ehon_salon_pico"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary flex items-center"
                      >
                        <div className="w-5 h-5 flex items-center justify-center text-primary mr-1">
                          <i className="ri-instagram-line"></i>
                        </div>
                        @ehon_salon_pico
                        <span className="text-sm text-gray-500 ml-2">- 絵本・イベント情報</span>
                      </a>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-bold mb-3">駐車場</h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2 mt-0.5">
                      <i className="ri-information-line"></i>
                    </div>
                    <span>近隣にコインパーキングあり（有料）</span>
                  </li>
                </ul>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <div className="w-6 h-6 flex items-center justify-center text-primary mr-2">
                  <i className="ri-map-pin-line"></i>
                </div>
                アクセス
              </h3>
              <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
                <div className="relative w-full pb-[100%] md:pb-[56.25%] bg-gray-200">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3276.1878921345005!2d135.46926407574895!3d34.801214472884155!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6000fb0182508b93%3A0x68fd9afe216deba9!2z44Kr44Or44OB44Oj44O877yG44OW44OD44Kv44Kr44OV44KnUElDTw!5e0!3m2!1sja!2sjp!4v1769402096928!5m2!1sja!2sjp"
                    title="カルチャーブックカフェPICO アクセスマップ"
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h4 className="font-bold mb-3">住所</h4>
                <p className="text-gray-700 mb-4">
                  〒560-0012 大阪府豊中市上野坂２丁目３−３ エルベラーノ1F
                </p>
                <h4 className="font-bold mb-3">交通アクセス</h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2 mt-0.5">
                      <i className="ri-train-line"></i>
                    </div>
                    <div>
                      <span className="font-medium">阪急宝塚線「豊中駅」</span>
                      <p className="text-sm mt-1">車で7分</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="w-5 h-5 flex items-center justify-center text-primary mr-2 mt-0.5">
                      <i className="ri-train-line"></i>
                    </div>
                    <div>
                      <span className="font-medium">大阪モノレール「少路駅」</span>
                      <p className="text-sm mt-1">徒歩8分</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* フォトギャラリー */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">フォトギャラリー</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryItems.map((item, index) => (
              <div
                key={index}
                className="gallery-item cursor-pointer overflow-hidden rounded-lg shadow-md"
                onClick={() => handleGalleryClick(item)}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* レンタルスペース */}
      <section className="py-8 md:py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">レンタルスペース PICO</h2>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden lg:overflow-visible lg:bg-transparent lg:shadow-none">
            <div className="flex flex-col lg:flex-row lg:gap-8">
              <div className="w-full lg:w-1/2 relative min-h-[300px] md:min-h-[500px] lg:bg-white lg:rounded-lg lg:shadow-lg lg:overflow-hidden">
                <div className="relative">
                  <div
                    id="rentalSpaceSlider"
                    className="w-full h-[400px] relative overflow-hidden rounded-lg"
                  >
                    {rentalSpaceSlides.map((slide, index) => (
                      <img
                        key={index}
                        src={slide.image}
                        alt={slide.alt}
                        className={`w-full h-full object-cover absolute transition-opacity duration-500 ${index === currentRentalSlide ? 'opacity-100' : 'opacity-0'}`}
                      />
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {rentalSpaceSlides.map((slide, index) => (
                      <button
                        key={index}
                        className={`rental-thumb w-full aspect-[4/3] rounded-lg overflow-hidden ${index === currentRentalSlide ? 'opacity-100' : 'opacity-70'} hover:opacity-100 transition-opacity`}
                        onClick={() => handleRentalThumbClick(index)}
                      >
                        <img
                          src={slide.image}
                          alt={slide.alt}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-1/2 p-4 md:p-8 lg:bg-white lg:rounded-lg lg:shadow-lg relative">
                <div className="absolute inset-0 opacity-10">
                  <img
                    src={withBase('images/readdy/4f76a51c3300c6ee851305a0b7c3e336.png')}
                    alt="Background"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center mb-4 md:mb-6">
                    <div className="w-6 md:w-8 h-6 md:h-8 flex items-center justify-center text-primary mr-2">
                      <i className="ri-building-line ri-lg"></i>
                    </div>
                    <h2 className="text-xl md:text-2xl font-bold">
                      おもしろい人に、ひらかれた場所。はじまります。
                    </h2>
                  </div>
                  <div className="space-y-4 md:space-y-6 lg:space-y-8 text-gray-700">
                    <div className="space-y-3 md:space-y-4 lg:space-y-6 leading-relaxed text-base md:text-lg">
                      <p>PICOで、なにかおもしろいこと、してみませんか？</p>
                      <p>
                        「作品を見てもらいたい」
                        <br />
                        「だれかと何かやってみたい」
                        <br />
                        「まだかたちにはなってないけど、とにかく動きたい」
                      </p>
                      <p>
                        そんな気持ちを持っている人へ。
                        <br />
                        PICOでは、カフェスペースやお部屋の空いている時間を、お貸ししています。
                      </p>
                      <p>
                        むずかしいルールはありません。
                        <br />
                        やってみたい気持ちがあれば、自分のペースで、どうぞ。
                      </p>
                      <p>
                        設営や告知などはご自身にお願いしていますが、
                        <br />
                        PICOのスタッフも、できるかぎりサポートします。
                      </p>
                      <p>
                        「お店じゃないけど、ちょっとだけ、やってみたい。」
                        <br />
                        そんなあなたに、ちょうどいい場所かもしれません。
                      </p>
                      <p>気になった方は、お気軽に声をかけてくださいね。</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 md:p-6 lg:p-8">
                      <h3 className="font-bold text-base md:text-lg lg:text-xl mb-2 md:mb-3 lg:mb-4">
                        特徴
                      </h3>
                      <ul className="space-y-2 md:space-y-3 text-sm md:text-base">
                        <li className="flex items-start">
                          <div className="w-5 h-5 flex items-center justify-center text-primary mr-2 mt-1">
                            <i className="ri-check-line"></i>
                          </div>
                          <span>作品展示・物販・ワークショップなど、様々なコンテンツに対応</span>
                        </li>
                        <li className="flex items-start">
                          <div className="w-5 h-5 flex items-center justify-center text-primary mr-2 mt-1">
                            <i className="ri-check-line"></i>
                          </div>
                          <span>PICOスタッフによる告知や開催のサポート体制あり</span>
                        </li>
                      </ul>
                    </div>
                    <p className="text-center font-medium">
                      あなたの「おもしろいこと」を、PICOで形にしてみませんか？
                    </p>
                    <div className="flex justify-center mt-6 md:mt-8 lg:mt-10">
                      <Link to="/contact-pico">
                        <button className="bg-primary text-white px-8 md:px-10 lg:px-12 py-3 md:py-4 lg:py-5 text-base md:text-lg lg:text-xl font-medium rounded-button whitespace-nowrap hover:bg-primary/90 transition-colors flex items-center">
                          お問い合わせ
                          <div className="w-6 h-6 flex items-center justify-center ml-2">
                            <i className="ri-arrow-right-line"></i>
                          </div>
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 画像モーダル */}
      {activeGalleryModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
          onClick={() => setActiveGalleryModal(false)}
        >
          <button
            className="absolute top-4 right-4 bg-black/50 text-white rounded-full w-10 h-10 flex items-center justify-center"
            onClick={(e) => {
              e.stopPropagation();
              setActiveGalleryModal(false);
            }}
          >
            <i className="ri-close-line ri-lg"></i>
          </button>
          <div className="max-w-4xl max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
            <img
              src={galleryImage.src}
              alt={galleryImage.alt}
              className="max-w-full max-h-full object-contain"
            />
            <p className="text-white text-center mt-4 text-lg">{galleryImage.caption}</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PicoPage;
