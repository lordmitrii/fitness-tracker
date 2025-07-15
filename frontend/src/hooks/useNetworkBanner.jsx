import { useEffect, useState } from "react";

function useNetworkBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setOnline(true);
      setShowOnline(true);
      setTimeout(() => setShowOnline(false), 1800);
    }
    function handleOffline() {
      setOnline(false);
      setShowOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { online, showOnline };
}

export default useNetworkBanner;
