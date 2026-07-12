import { useEffect } from 'react';
import { recordFrontendPerformance } from '../../lib/frontendPerformance';

const PageLoading = () => {
  useEffect(() => {
    const startTime = performance.now();
    const canObservePaint = typeof window.requestAnimationFrame === 'function';
    let wasPainted = !canObservePaint;
    const frameId = canObservePaint
      ? window.requestAnimationFrame(() => {
          wasPainted = true;
        })
      : undefined;

    return () => {
      if (frameId !== undefined && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }
      if (wasPainted) {
        recordFrontendPerformance('suspense_loader_visible', performance.now() - startTime);
      }
    };
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white px-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent motion-reduce:animate-none motion-reduce:border-t-primary motion-reduce:opacity-70"
          aria-hidden="true"
        />
        <p className="text-sm text-gray-600">ページを読み込んでいます…</p>
      </div>
    </div>
  );
};

export default PageLoading;
