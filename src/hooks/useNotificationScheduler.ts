import { useCallback, useEffect, useRef } from 'react';
import { NOTIFICATION_CHECK_INTERVAL_MS } from '../constants/notifications';
import {
  processScheduledNotifications,
  registerBackgroundSync,
} from '../services/notificationService';
import { useActiveVehicleId } from '../stores/vehicleContextStore';
import { useDashboardRefreshStore } from '../stores/dashboardRefreshStore';

export function useNotificationScheduler(userId: string | null, isReady: boolean): void {
  const activeVehicleId = useActiveVehicleId();
  const revision = useDashboardRefreshStore((state) => state.revision);
  const isRunningRef = useRef(false);

  const runCheck = useCallback(async () => {
    if (!userId || isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;
    try {
      await processScheduledNotifications(userId, activeVehicleId);
    } finally {
      isRunningRef.current = false;
    }
  }, [userId, activeVehicleId]);

  useEffect(() => {
    if (!isReady || !userId) {
      return;
    }

    void registerBackgroundSync();
    void runCheck();

    const intervalId = window.setInterval(() => {
      void runCheck();
    }, NOTIFICATION_CHECK_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void runCheck();
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isReady, userId, revision, runCheck]);
}
