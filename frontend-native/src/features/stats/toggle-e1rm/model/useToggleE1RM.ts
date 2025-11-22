import { useState, useCallback } from "react";

export function useToggleE1RM() {
  const [showE1RM, setShowE1RM] = useState<Record<number, boolean>>({});

  const toggleE1RM = useCallback((id: number) => {
    setShowE1RM((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return { showE1RM, toggleE1RM };
}

