import { measureFrontendOperation, recordFrontendPerformance } from './frontendPerformance';

describe('frontendPerformance', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/sample?utm_source=line&line_id=01&preview=1');
    window.dataLayer = [];
    window.__OKJL_PERFORMANCE_METRICS__ = [];
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('URLパラメータの値を保持せず、件数と計測パラメータの有無だけを記録する', () => {
    recordFrontendPerformance('sample_metric', 123.6);

    expect(window.__OKJL_PERFORMANCE_METRICS__).toEqual([
      expect.objectContaining({
        name: 'sample_metric',
        duration_ms: 124,
        page_path: '/sample',
        query_parameter_count: 3,
        has_tracking_parameters: true,
      }),
    ]);
    expect(JSON.stringify(window.__OKJL_PERFORMANCE_METRICS__)).not.toContain('line_id=01');
    expect(window.dataLayer).toContainEqual(
      expect.objectContaining({
        event: 'frontend_performance',
        metric_name: 'sample_metric',
        metric_duration_ms: 124,
      }),
    );
  });

  it('非同期処理の成功時間と結果を記録する', async () => {
    await expect(
      measureFrontendOperation('graphql_request', async () => 'ok', { request_type: 'post' }),
    ).resolves.toBe('ok');

    expect(window.__OKJL_PERFORMANCE_METRICS__).toContainEqual(
      expect.objectContaining({
        name: 'graphql_request',
        request_type: 'post',
        result: 'success',
      }),
    );
  });

  it('非同期処理が失敗しても時間を記録し、元の例外を再送出する', async () => {
    const error = new Error('request failed');

    await expect(
      measureFrontendOperation('graphql_request', async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(window.__OKJL_PERFORMANCE_METRICS__).toContainEqual(
      expect.objectContaining({
        name: 'graphql_request',
        result: 'error',
      }),
    );
  });
});
