// ----------------------------------------
// 簡易パスワードロック
// ロックを外すときは PASSWORD_LOCK_ENABLED を false にするだけでOK
// ----------------------------------------
(() => {
  const PASSWORD_LOCK_ENABLED = false;
  if (!PASSWORD_LOCK_ENABLED) return;

  const PASSWORD = 'sunsun2025'; // 必要に応じて変更
  const STORAGE_KEY = 'sunsunkidsvillage:unlocked';
  const root = document.documentElement;

  // 先に非表示にしてチラ見えを防ぐ
  root.style.visibility = 'hidden';

  // 同一セッション内では再入力を省略
  const alreadyUnlocked = sessionStorage.getItem(STORAGE_KEY) === '1';
  if (alreadyUnlocked) {
    root.style.visibility = '';
    return;
  }

  const input = window.prompt('パスワードを入力してください');
  if (input === PASSWORD) {
    sessionStorage.setItem(STORAGE_KEY, '1');
    root.style.visibility = '';
  } else {
    alert('パスワードが違います。');
    location.href = 'about:blank';
  }
})();
