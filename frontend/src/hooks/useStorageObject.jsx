import { useEffect, useState, useCallback } from "react";

const useStorageObject = (key, initialValue, storage = sessionStorage) => {
  const [value, setValue] = useState(initialValue);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    try {
      const saved = storage.getItem(key);
      if (saved) {
        setValue({ ...initialValue, ...JSON.parse(saved) });
      }
    } catch (err) {
      console.error("Failed to read storage for key:", key, err);
    } finally {
      setRestoring(false);
    }
  }, [storage, key]);

  useEffect(() => {
    if (restoring) return;
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error("Failed to write storage for key:", key, err);
    }
  }, [storage, key, value, restoring]);

  const clear = useCallback(() => {
    try {
      storage.removeItem(key);
    } catch (err) {
      console.error("Failed to clear storage for key:", key, err);
    } finally {
      setValue(initialValue);
    }
  }, [storage, key, initialValue]);

  return [value, setValue, { clear, restoring }];
};

export default useStorageObject;
