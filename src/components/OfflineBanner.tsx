import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[150] bg-amber-500 text-white text-xs font-bold py-1.5 px-3 flex items-center justify-center gap-2 shadow-md"
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline — showing cached data. Changes will not sync until reconnected.</span>
    </div>
  );
}
