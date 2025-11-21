import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const ACCESS_TOKEN_KEY = "auth.access_token";
const REFRESH_TOKEN_KEY = "auth.refresh_token";

export interface TokenPair {
  accessToken: string | null;
  refreshToken: string | null;
}

const useSecureStore =
  Platform.OS !== "web" &&
  typeof SecureStore.getItemAsync === "function" &&
  typeof SecureStore.setItemAsync === "function" &&
  typeof SecureStore.deleteItemAsync === "function";

const canUseAsyncStorage =
  Platform.OS !== "web" || typeof window !== "undefined";
const memoryStore = new Map<string, string>();

const getItem = async (key: string): Promise<string | null> => {
  if (useSecureStore) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(
        "SecureStore getItem failed, falling back to AsyncStorage",
        error
      );
    }
  }

  if (canUseAsyncStorage) {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn("AsyncStorage getItem failed", error);
    }
  }

  return memoryStore.get(key) ?? null;
};

const setItem = async (key: string, value: string): Promise<void> => {
  if (useSecureStore) {
    try {
      await SecureStore.setItemAsync(key, value);
      return;
    } catch (error) {
      console.warn(
        "SecureStore setItem failed, falling back to AsyncStorage",
        error
      );
    }
  }

  if (canUseAsyncStorage) {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch (error) {
      console.warn("AsyncStorage setItem failed", error);
    }
  }

  memoryStore.set(key, value);
};

const deleteItem = async (key: string): Promise<void> => {
  if (useSecureStore) {
    try {
      await SecureStore.deleteItemAsync(key);
      return;
    } catch (error) {
      console.warn(
        "SecureStore deleteItem failed, falling back to AsyncStorage",
        error
      );
    }
  }

  if (canUseAsyncStorage) {
    try {
      await AsyncStorage.removeItem(key);
      return;
    } catch (error) {
      console.warn("AsyncStorage deleteItem failed", error);
    }
  }

  memoryStore.delete(key);
};

const setOrDelete = async (
  key: string,
  value: string | null
): Promise<void> => {
  if (value) {
    await setItem(key, value);
  } else {
    await deleteItem(key);
  }
};

export const loadStoredTokens = async (): Promise<TokenPair> => {
  try {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(ACCESS_TOKEN_KEY),
      getItem(REFRESH_TOKEN_KEY),
    ]);

    return {
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
    };
  } catch (error) {
    console.warn("Failed to load stored tokens", error);
    return { accessToken: null, refreshToken: null };
  }
};

export const persistTokens = async ({
  accessToken,
  refreshToken,
}: TokenPair): Promise<void> => {
  try {
    await Promise.all([
      setOrDelete(ACCESS_TOKEN_KEY, accessToken),
      setOrDelete(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  } catch (error) {
    console.warn("Failed to persist tokens", error);
  }
};

export const clearStoredTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      deleteItem(ACCESS_TOKEN_KEY),
      deleteItem(REFRESH_TOKEN_KEY),
    ]);
  } catch (error) {
    console.warn("Failed to clear stored tokens", error);
  }
};
