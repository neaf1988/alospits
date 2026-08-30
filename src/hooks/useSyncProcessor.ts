import { useEffect, useRef } from 'react';
import { isSyncApiConfigured, processSyncOutbox } from '../services/syncProcessorService';
import { resetFailedSyncEntries } from '../services/syncOutboxService';

export function useSyncProcessor(userId: string | null) {
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (!userId || !isSyncApiConfigured()) {
      return;
    }

    async function runSync() {
      if (isProcessingRef.current || !navigator.onLine) {
        return;
      }

      isProcessingRef.current = true;
      try {
        await resetFailedSyncEntries(userId!);
        await processSyncOutbox(userId!);
      } finally {
        isProcessingRef.current = false;
      }
    }

    void runSync();

    function handleOnline() {
      void runSync();
    }

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [userId]);
}
