import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type StorageValue<T> = T;
type StorageObjectReturn<T> = [
  StorageValue<T>,
  React.Dispatch<React.SetStateAction<T>>,
  {
    clear: () => Promise<void>;
    restoring: boolean;
  }
];

export default function useStorageObject<T extends object>(
  key: string,
  initialValue: T
): StorageObjectReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [restoring, setRestoring] = useState(true);

  // Load from AsyncStorage on mount
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved && !cancelled) {
          const parsed = JSON.parse(saved);
          // merge with initialValue like in the web version
          setValue({ ...initialValue, ...parsed });
        }
      } catch (err) {
        console.error("Failed to read storage for key:", key, err);
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [key]);

  // Write to AsyncStorage on change
  useEffect(() => {
    if (restoring) return;

    const save = async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error("Failed to write storage for key:", key, err);
      }
    };

    save();
  }, [key, value, restoring]);

  const clear = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (err) {
      console.error("Failed to clear storage for key:", key, err);
    } finally {
      setValue(initialValue);
    }
  }, [key, initialValue]);

  return [value, setValue, { clear, restoring }];
}
