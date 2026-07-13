const STATIC_LOADER_MARK = 'okjl:static-loader-visible';
const REACT_SHELL_MARK = 'okjl:react-shell-ready';
const PERFORMANCE_EVENT_NAME = 'frontend_performance';
const TRACKING_PARAMETER_NAMES = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'line_id',
];

type PerformanceContextValue = string | number | boolean | null | undefined;

export type FrontendPerformanceContext = Record<string, PerformanceContextValue>;

export type FrontendPerformanceMetric = {
  name: string;
  duration_ms: number;
  page_path: string;
  navigation_type: string;
  query_parameter_count: number;
  has_tracking_parameters: boolean;
  recorded_at: string;
} & FrontendPerformanceContext;

declare global {
  interface Window {
    dataLayer?: unknown[];
    __OKJL_PERFORMANCE_METRICS__?: FrontendPerformanceMetric[];
  }
}

const reportedMetricKeys = new Set<string>();

const getNavigationEntry = () => {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return undefined;
  }

  return performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
};

const getNavigationType = () => getNavigationEntry()?.type ?? 'unknown';

const getPageContext = () => {
  if (typeof window === 'undefined') {
    return {
      page_path: '',
      query_parameter_count: 0,
      has_tracking_parameters: false,
    };
  }

  const searchParams = new URLSearchParams(window.location.search);

  return {
    page_path: window.location.pathname,
    query_parameter_count: Array.from(searchParams.keys()).length,
    has_tracking_parameters: TRACKING_PARAMETER_NAMES.some((name) => searchParams.has(name)),
  };
};

const normalizeDuration = (durationMs: number) => Math.max(0, Math.round(durationMs));

export const recordFrontendPerformance = (
  name: string,
  durationMs: number,
  context: FrontendPerformanceContext = {},
) => {
  if (typeof window === 'undefined' || !Number.isFinite(durationMs)) return;

  const metric: FrontendPerformanceMetric = {
    ...context,
    name,
    duration_ms: normalizeDuration(durationMs),
    ...getPageContext(),
    navigation_type: getNavigationType(),
    recorded_at: new Date().toISOString(),
  };

  window.__OKJL_PERFORMANCE_METRICS__ = window.__OKJL_PERFORMANCE_METRICS__ ?? [];
  window.__OKJL_PERFORMANCE_METRICS__.push(metric);

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({
    ...metric,
    event: PERFORMANCE_EVENT_NAME,
    metric_name: metric.name,
    metric_duration_ms: metric.duration_ms,
  });

  if (import.meta.env.DEV) {
    console.info(`[performance] ${metric.name}: ${metric.duration_ms}ms`, metric);
  }
};

const recordOnce = (
  key: string,
  name: string,
  durationMs: number,
  context: FrontendPerformanceContext = {},
) => {
  if (reportedMetricKeys.has(key) || durationMs <= 0) return;

  reportedMetricKeys.add(key);
  recordFrontendPerformance(name, durationMs, context);
};

const reportNavigationTiming = () => {
  const navigation = getNavigationEntry();
  if (!navigation) return;

  recordOnce('navigation_ttfb', 'navigation_ttfb', navigation.responseStart - navigation.startTime);
  recordOnce(
    'dom_content_loaded',
    'dom_content_loaded',
    navigation.domContentLoadedEventEnd - navigation.startTime,
  );
  recordOnce('window_load', 'window_load', navigation.loadEventEnd - navigation.startTime);
};

const reportFirstContentfulPaint = () => {
  if (typeof performance === 'undefined' || typeof performance.getEntriesByType !== 'function') {
    return;
  }

  const firstContentfulPaint = performance
    .getEntriesByType('paint')
    .find((entry) => entry.name === 'first-contentful-paint');

  if (firstContentfulPaint) {
    recordOnce('first_contentful_paint', 'first_contentful_paint', firstContentfulPaint.startTime);
  }
};

export const startFrontendPerformanceMeasurement = () => {
  if (typeof window === 'undefined') return;

  reportNavigationTiming();
  reportFirstContentfulPaint();

  const reportCompletedNavigation = () => {
    reportNavigationTiming();
    reportFirstContentfulPaint();
  };

  if (document.readyState === 'complete') {
    window.setTimeout(reportCompletedNavigation, 0);
    return;
  }

  window.addEventListener('load', reportCompletedNavigation, { once: true });
};

export const reportReactShellReady = () => {
  if (
    typeof window === 'undefined' ||
    typeof performance === 'undefined' ||
    typeof performance.mark !== 'function' ||
    typeof performance.getEntriesByName !== 'function'
  ) {
    return;
  }

  const report = () => {
    performance.mark(REACT_SHELL_MARK);

    recordOnce('react_shell_ready', 'react_shell_ready', performance.now());

    const staticLoaderMarks = performance.getEntriesByName(STATIC_LOADER_MARK, 'mark');
    const staticLoaderMark = staticLoaderMarks[staticLoaderMarks.length - 1];
    if (staticLoaderMark) {
      recordOnce(
        'static_loader_visible',
        'static_loader_visible',
        performance.now() - staticLoaderMark.startTime,
      );
    }
  };

  // Reactのコミット後に一度描画された時点を、初期シェル表示完了として記録する
  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => window.requestAnimationFrame(report));
    return;
  }

  window.setTimeout(report, 0);
};

export const measureFrontendOperation = async <T>(
  name: string,
  operation: () => Promise<T>,
  context: FrontendPerformanceContext = {},
) => {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const result = await operation();
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    recordFrontendPerformance(name, endTime - startTime, { ...context, result: 'success' });
    return result;
  } catch (error) {
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    recordFrontendPerformance(name, endTime - startTime, { ...context, result: 'error' });
    throw error;
  }
};
