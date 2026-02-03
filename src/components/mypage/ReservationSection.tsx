// src/components/mypage/ReservationSection.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

interface ReservationRecord {
  id: string;
  reservation_code: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  event_title: string | null;
  event_date: string | null;
  time_slot: string | null;
  quantity: number | null;
  status: string | null;
  created_at: string | null;
  event_slug?: string | null;
  event_location?: string | null;
  event_region?: string | null;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return '日程調整中';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const translateStatus = (status?: string | null) => {
  switch (status) {
    case 'confirmed':
      return '予約確定';
    case 'cancelled':
      return 'キャンセル済み';
    case 'pending':
    default:
      return '受付中';
  }
};

const statusClassName = (status?: string | null) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-100 text-green-800';
    case 'cancelled':
      return 'bg-red-100 text-red-600';
    case 'pending':
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
};

const toDatetimeLocalValue = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const ReservationSection: React.FC = () => {
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<ReservationRecord | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ReservationRecord | null>(null);
  const [editDateTime, setEditDateTime] = useState('');
  const [editTimeSlot, setEditTimeSlot] = useState('');
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [cancelReason, setCancelReason] = useState('');

  const fetchReservations = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('reservations')
      .select(
        'id, reservation_code, customer_name, customer_email, event_title, event_date, time_slot, quantity, status, created_at, event_slug, event_location, event_region',
      )
      .eq('user_id', userId)
      .order('event_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(`予約情報の取得に失敗しました: ${fetchError.message}`);
      setReservations([]);
    } else {
      setError(null);
      setActionMessage(null);
      setActionError(null);
      setReservations(data ?? []);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadInitial = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (!session?.user) {
        setReservations([]);
        setLoading(false);
        setError('予約情報を表示するにはログインが必要です。');
        return;
      }

      await fetchReservations(session.user.id);
    };

    loadInitial();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        fetchReservations(session.user.id);
      } else {
        setReservations([]);
        setError('予約情報を表示するにはログインが必要です。');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchReservations]);

  const latestReservation = reservations[0] ?? null;
  const pastReservations = useMemo(() => reservations.slice(1), [reservations]);

  const formatDateTimeWithSlot = (record: ReservationRecord) => {
    const dateLabel = formatDateTime(record.event_date);
    if (record.time_slot) {
      return `${dateLabel}（${record.time_slot}）`;
    }
    return dateLabel;
  };

  const openEditModal = (reservation: ReservationRecord) => {
    if (reservation.status === 'cancelled') {
      setActionError('キャンセル済みの予約は変更できません。');
      setActionMessage(null);
      return;
    }
    setEditTarget(reservation);
    setEditDateTime(toDatetimeLocalValue(reservation.event_date));
    setEditTimeSlot(reservation.time_slot ?? '');
    setEditQuantity(reservation.quantity ?? 1);
    setActionError(null);
    setActionMessage(null);
  };

  const closeEditModal = () => {
    setEditTarget(null);
    setEditDateTime('');
    setEditTimeSlot('');
    setEditQuantity(1);
  };

  const openCancelModal = (reservation: ReservationRecord) => {
    if (reservation.status === 'cancelled') {
      setActionError('この予約はすでにキャンセル済みです。');
      setActionMessage(null);
      return;
    }
    setCancelTarget(reservation);
    setCancelReason('');
    setActionError(null);
    setActionMessage(null);
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason('');
  };

  const handleUpdateReservation = async () => {
    if (!editTarget) return;

    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const eventDateIso = editDateTime ? new Date(editDateTime).toISOString() : null;

      const { error: updateError } = await supabase
        .from('reservations')
        .update({
          event_date: eventDateIso,
          time_slot: editTimeSlot || null,
          quantity: editQuantity,
          status: editTarget.status === 'cancelled' ? 'pending' : editTarget.status,
        })
        .eq('id', editTarget.id);

      if (updateError) {
        throw updateError;
      }

      setActionMessage('予約内容を更新しました。');
      closeEditModal();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchReservations(session.user.id);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? `予約の更新に失敗しました: ${err.message}` : '予約の更新に失敗しました。',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!cancelTarget) return;

    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const { error: cancelError } = await supabase
        .from('reservations')
        .update({
          status: 'cancelled',
          canceled_at: new Date().toISOString(),
          canceled_reason: cancelReason.trim() || null,
        })
        .eq('id', cancelTarget.id);

      if (cancelError) {
        throw cancelError;
      }

      setActionMessage('予約をキャンセルしました。');
      closeCancelModal();

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchReservations(session.user.id);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? `キャンセルに失敗しました: ${err.message}` : 'キャンセルに失敗しました。',
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section id="reservations-section">
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold mb-6 pb-2 border-b border-gray-200">予約履歴</h2>

        {actionMessage && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {actionMessage}
          </div>
        )}
        {actionError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {/* 最新の予約 */}
        <div className="mb-8">
          <h3 className="font-bold text-lg mb-4">最新の予約</h3>
          {loading ? (
            <div className="border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              読み込み中です…
            </div>
          ) : error ? (
            <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-6 text-sm">
              {error}
            </div>
          ) : latestReservation ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-primary/5 p-4 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <i className="ri-calendar-event-line text-primary"></i>
                  </div>
                  <div>
                    <h4 className="font-bold">
                      {latestReservation.event_title || 'イベント名未設定'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      予約番号：{latestReservation.reservation_code || '未発行'}
                    </p>
                  </div>
                </div>
                <span
                  className={`${statusClassName(latestReservation.status)} text-xs px-3 py-1 rounded-full font-medium`}
                >
                  {translateStatus(latestReservation.status)}
                </span>
              </div>
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">日時</p>
                    <p className="font-medium">{formatDateTimeWithSlot(latestReservation)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">場所</p>
                    <p className="font-medium">
                      {latestReservation.event_location || latestReservation.event_region || '会場情報未定'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">参加人数</p>
                    <p className="font-medium">{latestReservation.quantity ?? '-'}名</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">予約日</p>
                    <p className="font-medium">{formatDate(latestReservation.created_at)}</p>
                  </div>
                </div>
                {latestReservation.status === 'cancelled' && (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    この予約はキャンセル済みです。
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  {latestReservation.event_slug ? (
                    <Link
                      to={`/event/${latestReservation.event_slug}`}
                      className="border border-primary text-primary px-4 py-2 font-medium !rounded-button whitespace-nowrap hover:bg-primary/5 transition-colors flex items-center justify-center"
                    >
                      <div className="w-5 h-5 flex items-center justify-center mr-2">
                        <i className="ri-file-list-3-line"></i>
                      </div>
                      予約詳細を見る
                    </Link>
                  ) : (
                    <span className="border border-gray-200 text-gray-400 px-4 py-2 font-medium !rounded-button whitespace-nowrap flex items-center justify-center cursor-not-allowed">
                      <div className="w-5 h-5 flex items-center justify-center mr-2">
                        <i className="ri-file-list-3-line"></i>
                      </div>
                      予約詳細を見る
                    </span>
                  )}
                  <button
                    onClick={() => openEditModal(latestReservation)}
                    className={`border border-gray-300 text-gray-700 px-4 py-2 font-medium !rounded-button whitespace-nowrap flex items-center justify-center transition-colors ${
                      latestReservation.status === 'cancelled'
                        ? 'cursor-not-allowed text-gray-400 border-gray-200'
                        : 'hover:bg-gray-50'
                    }`}
                    disabled={latestReservation.status === 'cancelled'}
                  >
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-edit-line"></i>
                    </div>
                    予約を変更
                  </button>
                  <button
                    onClick={() => openCancelModal(latestReservation)}
                    className={`border border-red-300 px-4 py-2 font-medium !rounded-button whitespace-nowrap flex items-center justify-center transition-colors ${
                      latestReservation.status === 'cancelled'
                        ? 'cursor-not-allowed text-red-300 border-red-100'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                    disabled={latestReservation.status === 'cancelled'}
                  >
                    <div className="w-5 h-5 flex items-center justify-center mr-2">
                      <i className="ri-close-circle-line"></i>
                    </div>
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              まだ予約は登録されていません。
            </div>
          )}
        </div>

        {/* 過去の予約 */}
        <div>
          <h3 className="font-bold text-lg mb-4">過去の予約</h3>
          {loading ? (
            <div className="border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              読み込み中です…
            </div>
          ) : error ? (
            <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-6 text-sm">
              {error}
            </div>
          ) : pastReservations.length > 0 ? (
            <>
              <div className="overflow-x-auto max-w-full">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">イベント名</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">予約番号</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ステータス</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pastReservations.map((reservation) => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {reservation.event_title || 'イベント名未設定'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {formatDateTimeWithSlot(reservation)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {reservation.reservation_code || '未発行'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`${statusClassName(reservation.status)} text-xs px-3 py-1 rounded-full font-medium`}
                          >
                            {translateStatus(reservation.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {reservation.status === 'cancelled' ? (
                            <span className="text-gray-400">キャンセル済み</span>
                          ) : (
                            <div className="flex items-center gap-3">
                              {reservation.event_slug ? (
                                <Link to={`/event/${reservation.event_slug}`} className="text-primary hover:text-primary/80">
                                  詳細
                                </Link>
                              ) : (
                                <span className="text-gray-300 cursor-not-allowed">詳細</span>
                              )}
                              <button
                                onClick={() => openEditModal(reservation)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                変更
                              </button>
                              <button
                                onClick={() => openCancelModal(reservation)}
                                className="text-red-500 hover:text-red-700"
                              >
                                キャンセル
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-center">
                <button className="text-primary hover:text-primary/80 flex items-center" disabled>
                  もっと見る
                  <div className="w-5 h-5 flex items-center justify-center ml-1">
                    <i className="ri-arrow-down-s-line"></i>
                  </div>
                </button>
              </div>
            </>
          ) : (
            <div className="border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-500">
              過去の予約履歴はありません。
            </div>
          )}
        </div>
      </div>

      {editTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">予約内容を変更</h3>
              <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line ri-lg"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">イベント名</label>
                <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {editTarget.event_title || 'イベント名未設定'}
                </p>
              </div>
              <div>
                <label htmlFor="reservation-edit-datetime" className="mb-2 block text-sm font-medium text-gray-700">
                  開催日時
                </label>
                <input
                  id="reservation-edit-datetime"
                  type="datetime-local"
                  value={editDateTime}
                  onChange={(event) => setEditDateTime(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                />
                <p className="mt-1 text-xs text-gray-500">
                  未定の場合は空欄のままにしてください。
                </p>
              </div>
              <div>
                <label htmlFor="reservation-edit-timeslot" className="mb-2 block text-sm font-medium text-gray-700">
                  時間帯ラベル
                </label>
                <input
                  id="reservation-edit-timeslot"
                  type="text"
                  value={editTimeSlot}
                  onChange={(event) => setEditTimeSlot(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                  placeholder="例：14:00〜14:30"
                />
              </div>
              <div>
                <label htmlFor="reservation-edit-quantity" className="mb-2 block text-sm font-medium text-gray-700">
                  参加人数
                </label>
                <input
                  id="reservation-edit-quantity"
                  type="number"
                  min={1}
                  max={10}
                  value={editQuantity}
                  onChange={(event) => setEditQuantity(Number(event.target.value) || 1)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeEditModal}
                className="w-full rounded-button border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50 sm:w-auto"
                disabled={actionLoading}
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateReservation}
                className={`w-full rounded-button bg-primary px-4 py-2 text-center font-medium text-white transition-colors ${
                  actionLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'
                } sm:w-auto`}
                disabled={actionLoading}
              >
                {actionLoading ? '更新中…' : '変更を保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-600">予約をキャンセル</h3>
              <button onClick={closeCancelModal} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line ri-lg"></i>
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                以下の予約をキャンセルします。よろしければキャンセル理由を入力して「キャンセルを確定」を押してください。
              </p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <p className="font-semibold">{cancelTarget.event_title || 'イベント名未設定'}</p>
                <p className="mt-1 text-gray-600">予約番号：{cancelTarget.reservation_code || '未発行'}</p>
                <p className="mt-1 text-gray-600">日時：{formatDateTimeWithSlot(cancelTarget)}</p>
              </div>
              <div>
                <label htmlFor="reservation-cancel-reason" className="mb-2 block text-sm font-medium text-gray-700">
                  キャンセル理由（任意）
                </label>
                <textarea
                  id="reservation-cancel-reason"
                  rows={3}
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700"
                  placeholder="例：都合がつかなくなったため"
                />
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={closeCancelModal}
                className="w-full rounded-button border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50 sm:w-auto"
                disabled={actionLoading}
              >
                戻る
              </button>
              <button
                onClick={handleCancelReservation}
                className={`w-full rounded-button bg-red-500 px-4 py-2 text-center font-medium text-white transition-colors ${
                  actionLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-red-600'
                } sm:w-auto`}
                disabled={actionLoading}
              >
                {actionLoading ? '処理中…' : 'キャンセルを確定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReservationSection;
