import { useEffect, useState } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

function useNetworkBanner() {
  const [online, setOnline] = useState(true);
  const [showOnline, setShowOnline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected ?? false;
      
      if (isConnected && !online) {
        setOnline(true);
        setShowOnline(true);
        setTimeout(() => setShowOnline(false), 1800);
      } else if (!isConnected) {
        setOnline(false);
        setShowOnline(false);
      } else {
        setOnline(true);
      }
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      setOnline(state.isConnected ?? false);
      });

    return () => {
      unsubscribe();
    };
  }, [online]);

  return { online, showOnline };
}

export default useNetworkBanner;

