import { watch, onUnmounted, type Ref, type ComputedRef } from 'vue';

let lockCount = 0;
let previousBodyPosition = '';
let previousBodyTop = '';
let previousBodyWidth = '';
let previousBodyOverflow = '';
let previousHtmlOverflow = '';
let savedScrollY = 0;

export function useBodyScrollLock(isLocked: Ref<boolean> | ComputedRef<boolean>) {
  function lock() {
    if (typeof document === 'undefined') return;
    if (lockCount === 0) {
      savedScrollY = window.scrollY || document.documentElement.scrollTop;
      previousBodyPosition = document.body.style.position;
      previousBodyTop = document.body.style.top;
      previousBodyWidth = document.body.style.width;
      previousBodyOverflow = document.body.style.overflow;
      previousHtmlOverflow = document.documentElement.style.overflow;

      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    lockCount++;
  }

  function unlock() {
    if (typeof document === 'undefined') return;
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount === 0) {
      document.body.style.position = previousBodyPosition;
      document.body.style.top = previousBodyTop;
      document.body.style.width = previousBodyWidth;
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.scrollTo(0, savedScrollY);
    }
  }

  watch(
    isLocked,
    (val, oldVal) => {
      if (val && !oldVal) {
        lock();
      } else if (!val && oldVal) {
        unlock();
      }
    },
    { immediate: true }
  );

  onUnmounted(() => {
    if (isLocked.value) {
      unlock();
    }
  });
}
