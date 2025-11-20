import { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "@/src/api";
import useVersionsData from "@/src/hooks/data/userVersionsData";

type ConsentType = string;

interface UseConsentResult {
  consentGiven: boolean;
  ready: boolean;
  giveConsent: () => Promise<void>;
  revokeConsent: () => Promise<void>;
}

export default function useConsent(type: ConsentType): UseConsentResult {
  const { getVersion } = useVersionsData();
  const version = getVersion(type);
  const storageKey = useMemo(
    () => `${type}_consent_v${version ?? "0"}`,
    [type, version]
  );

  const [consentGiven, setConsentGiven] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      try {
        const cached = await AsyncStorage.getItem(storageKey);
        if (cancelled) return;

        if (cached != null) {
          setConsentGiven(cached === "true");
          setReady(true);
          return;
        }

        const response = await api.get("/users/consents");
        const collection = Array.isArray(response.data)
          ? response.data
          : [];
        const consent = collection.find(
          (c) => c?.type === type && c?.version === version
        );
        const given = Boolean(consent?.given);

        await AsyncStorage.setItem(storageKey, given ? "true" : "false");
        if (!cancelled) {
          setConsentGiven(given);
          setReady(true);
        }
      } catch (error) {
        console.error("useConsent hydrate error", error);
        if (!cancelled) {
          setConsentGiven(false);
          setReady(true);
        }
      }
    };

    hydrate();

    return () => {
      cancelled = true;
    };
  }, [storageKey, type, version]);

  const giveConsent = useCallback(async () => {
    setConsentGiven(true);
    await AsyncStorage.setItem(storageKey, "true");
    try {
      await api.post("/users/consents", {
        type,
        version,
        given: true,
      });
    } catch (error) {
      console.error("Failed to persist consent", error);
    }
  }, [storageKey, type, version]);

  const revokeConsent = useCallback(async () => {
    setConsentGiven(false);
    await AsyncStorage.setItem(storageKey, "false");
    try {
      await api.delete("/users/consents", { data: { type, version } });
    } catch (error) {
      console.error("Failed to revoke consent", error);
    }
  }, [storageKey, type, version]);

  return {
    consentGiven,
    ready,
    giveConsent,
    revokeConsent,
  };
}
