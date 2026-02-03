import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Session, User } from '@supabase/supabase-js';
import Layout from '../components/Layout/Layout';
import Seo from '../components/seo/Seo';
import { shouldNoIndex } from '../utils/seo';
import { supabase } from '../lib/supabaseClient';

type ReservationRecord = {
  id: string;
  reservation_code: string;
  user_id?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  event_slug?: string | null;
  event_title?: string | null;
  event_date?: string | null;
  time_slot?: string | null;
  quantity?: number | null;
  status?: string | null;
  phone?: string | null;
  special_requests?: string | null;
  event_location?: string | null;
  event_region?: string | null;
  created_at?: string | null;
};

type ApiResponse =
  | { ok: true; reservations: ReservationRecord[] }
  | { ok: false; error: string };

const formatDateTime = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const normalize = (value?: string | null) => value?.toLowerCase().trim() ?? '';

const AdminReservationsPage = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [eventSlugFilter, setEventSlugFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const noindex = shouldNoIndex({ force: true });

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchReservations = useCallback(
    async (options?: { eventSlug?: string }) => {
      if (!session) {
        setAuthorized(false);
        setReservations([]);
        return;
      }

      setFetching(true);
      setError(null);

      const body =
        options?.eventSlug && options.eventSlug.trim().length > 0
          ? { eventSlug: options.eventSlug.trim() }
          : {};

      const { data, error: invokeError } = await supabase.functions.invoke<ApiResponse>(
        'admin_reservations',
        {
          body,
        },
      );

      if (invokeError) {
        const status = typeof (invokeError as Record<string, unknown>)?.['status'] === 'number'
          ? Number((invokeError as Record<string, unknown>)['status'])
          : null;
        const message = invokeError.message ?? '';

        if (status === 403 || message.includes('forbidden')) {
          setAuthorized(false);
          setError('閲覧権限がありません。システム担当者にお問い合わせください。');
        } else if (status === 401 || message.includes('missing_token')) {
          setAuthorized(false);
          setError('認証情報が確認できませんでした。ログインし直してください。');
        } else {
          setAuthorized(false);
          setError(`予約一覧の取得に失敗しました: ${message}`);
        }
        setReservations([]);
      } else if (!data || data.ok === false) {
        const message =
          data?.error === 'forbidden'
            ? '閲覧権限がありません。システム担当者にお問い合わせください。'
            : data?.error
              ? `予約一覧の取得に失敗しました: ${data.error}`
              : '予約一覧の取得に失敗しました。';
        if (data?.error === 'forbidden') {
          setAuthorized(false);
        }
        setError(message);
        setReservations([]);
      } else {
        setAuthorized(true);
        setReservations(data.reservations ?? []);
      }

      setFetching(false);
    },
    [session],
  );

  useEffect(() => {
    if (!session) return;
    fetchReservations();
  }, [session, fetchReservations]);

  const handleDownloadCsv = useCallback(
    (items: ReservationRecord[]) => {
      if (!items.length) return;

      const headers = [
        '予約ID',
        '予約コード',
        'ユーザーID',
        '氏名',
        'メールアドレス',
        'イベントスラッグ',
        'イベントタイトル',
        '開催日時',
        '時間帯',
        '人数',
        'ステータス',
        '電話番号',
        '特記事項',
        '会場',
        '地域',
        '作成日時',
      ];

      const escape = (value: unknown) => {
        if (value === null || value === undefined) return '';
        const text = String(value).replace(/\r?\n/g, ' ');
        if (text.includes('"') || text.includes(',') || text.includes('\n')) {
          return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
      };

      const rows = items.map((item) => [
        item.id,
        item.reservation_code,
        item.user_id ?? '',
        item.customer_name ?? '',
        item.customer_email ?? '',
        item.event_slug ?? '',
        item.event_title ?? '',
        formatDateTime(item.event_date),
        item.time_slot ?? '',
        item.quantity ?? '',
        item.status ?? '',
        item.phone ?? '',
        item.special_requests ?? '',
        item.event_location ?? '',
        item.event_region ?? '',
        formatDateTime(item.created_at),
      ]);

      const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reservations_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    [],
  );

  const handleRefetch = () => {
    fetchReservations(eventSlugFilter ? { eventSlug: eventSlugFilter } : undefined);
  };

  const filteredReservations = useMemo(() => {
    if (!searchTerm) return reservations;
    const query = normalize(searchTerm);
      return reservations.filter((item) => {
        return [
          item.reservation_code,
          item.customer_name,
          item.customer_email,
          item.event_slug,
        item.event_title,
        item.event_location,
        item.event_region,
        item.time_slot,
        item.phone,
        item.special_requests,
      ]
        .map(normalize)
        .some((value) => value.includes(query));
    });
  }, [reservations, searchTerm]);

  const content = () => {
    if (!session || !user) {
      return (
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">予約一覧（管理者）</h1>
          <p>閲覧にはログインが必要です。</p>
          <Link
            to="/login"
            className="inline-flex items-center rounded bg-primary px-4 py-2 font-medium text-white hover:bg-primary-dark"
          >
            ログインページへ
          </Link>
        </div>
      );
    }

    if (!authorized) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold">予約一覧（管理者）</h1>
          <p className="text-red-600">{error ?? '閲覧権限がありません。'}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">予約一覧（管理者）</h1>
            <p className="text-sm text-gray-600">
              Supabase 上の予約データを直接参照しています。データの取り扱いにはご注意ください。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleDownloadCsv(filteredReservations)}
              className="rounded border border-primary px-4 py-2 text-primary transition hover:bg-primary hover:text-white"
              disabled={!filteredReservations.length}
            >
              CSVダウンロード
            </button>
            <button
              type="button"
              onClick={handleRefetch}
              className="rounded bg-primary px-4 py-2 text-white hover:bg-primary-dark disabled:opacity-70"
              disabled={fetching}
            >
              {fetching ? '再取得中…' : '最新の情報を再取得'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="eventSlugFilter">
              イベントスラッグで絞り込み
            </label>
            <div className="flex gap-2">
              <input
                id="eventSlugFilter"
                type="text"
                value={eventSlugFilter}
                onChange={(e) => setEventSlugFilter(e.target.value)}
                placeholder="例: spring-festival-2025"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() =>
                  fetchReservations(
                    eventSlugFilter.trim()
                      ? { eventSlug: eventSlugFilter.trim() }
                      : undefined,
                  )
                }
                className="shrink-0 rounded bg-gray-800 px-3 py-2 text-white hover:bg-gray-900"
              >
                適用
              </button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="searchTerm">
              キーワード検索
            </label>
            <input
              id="searchTerm"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="予約コード / イベント名 / 地域 など"
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  予約コード
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  氏名
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  イベント
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  日時
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  人数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  ステータス
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  連絡先
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  作成日時
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredReservations.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    <div>{item.reservation_code}</div>
                    <div className="text-xs text-gray-500">{item.user_id}</div>
                    {item.customer_email && (
                      <div className="text-xs text-gray-500">{item.customer_email}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {item.customer_name ?? '未入力'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    <div className="font-medium">{item.event_title ?? '未設定'}</div>
                    <div className="text-xs text-gray-500">{item.event_slug}</div>
                    {item.event_region && (
                      <div className="text-xs text-gray-500">{item.event_region}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    <div>{formatDateTime(item.event_date)}</div>
                    {item.time_slot && <div className="text-xs text-gray-500">{item.time_slot}</div>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {item.quantity ?? '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {item.status ?? '未設定'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {item.phone ?? '記録なし'}
                    {item.special_requests && (
                      <div className="text-xs text-gray-500">備考: {item.special_requests}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {formatDateTime(item.created_at)}
                  </td>
                </tr>
              ))}
              {!filteredReservations.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    {fetching ? '読み込み中…' : '表示できる予約がありません。'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <Seo title="予約一覧（管理者）" description="管理者専用 予約一覧ページ" noindex={noindex} />
      <div className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center text-gray-600">認証情報を確認中です…</div>
        ) : error && !authorized && (!session || !user) ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold">予約一覧（管理者）</h1>
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          content()
        )}
      </div>
    </Layout>
  );
};

export default AdminReservationsPage;
