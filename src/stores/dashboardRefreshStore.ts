import { create } from 'zustand';

interface DashboardRefreshState {
  revision: number;
  bump: () => void;
}

export const useDashboardRefreshStore = create<DashboardRefreshState>((set) => ({
  revision: 0,
  bump: () => set((state) => ({ revision: state.revision + 1 })),
}));
