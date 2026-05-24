import { createContext, useContext } from 'react';

// Loose typing — context value is the giant App state object built in App.tsx.
// Views cast to specific shape they need.
export type AppCtx = Record<string, any>;

export const AppContext = createContext<AppCtx | null>(null);

export const useApp = (): AppCtx => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};
