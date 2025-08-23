import { useEffect, useState } from "react";

export default function TouchHotspot({ tapsNeeded, onOpen }) {
  const [taps, setTaps] = useState(0);
  useEffect(() => {
    if (taps >= tapsNeeded) {
      onOpen();
      setTaps(0);
    }
    const id = setTimeout(() => setTaps(0), 1500);
    return () => clearTimeout(id);
  }, [taps, onOpen]);

  return (
    <div
      onClick={() => setTaps((t) => t + 1)}
      className="fixed top-[env(safe-area-inset-top)] left-0 w-16 h-16 z-9999"
    />
  );
}
