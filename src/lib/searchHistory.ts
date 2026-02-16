import { supabase } from './supabaseClient';

export interface SearchHistory {
  id: string;
  query: string;
  created_at: string;
  user_id?: string;
}

export const searchHistoryApi = {
  // 検索履歴を保存
  async saveSearchHistory(query: string): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // 非ログイン時は保存しない（RLS違反を防止）
      if (!user) return;

      const { error } = await supabase.from('search_history').insert({
        query: query.trim(),
        user_id: user.id,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('検索履歴保存エラー:', error);
      }
    } catch (error) {
      console.error('検索履歴保存エラー:', error);
    }
  },

  // ユーザーの検索履歴を取得
  async getSearchHistory(limit: number = 10): Promise<SearchHistory[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('検索履歴取得エラー:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('検索履歴取得エラー:', error);
      return [];
    }
  },

  // 検索履歴を削除
  async deleteSearchHistory(id: string): Promise<void> {
    try {
      const { error } = await supabase.from('search_history').delete().eq('id', id);

      if (error) {
        console.error('検索履歴削除エラー:', error);
      }
    } catch (error) {
      console.error('検索履歴削除エラー:', error);
    }
  },

  // 検索履歴をすべて削除
  async clearSearchHistory(): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error } = await supabase.from('search_history').delete().eq('user_id', user.id);

      if (error) {
        console.error('検索履歴全削除エラー:', error);
      }
    } catch (error) {
      console.error('検索履歴全削除エラー:', error);
    }
  },
};
