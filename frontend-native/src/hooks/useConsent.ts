import { useState, useEffect } from "react";
import api from "@/src/api";
import useVersionsData from "./data/userVersionsData";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useConsent = (type: string) => {
  const { getVersion } = useVersionsData();
  const version = getVersion(type);
  const storageKey = `${type}_consent_v${version}`;

  const [consentGiven, setConsentGiven] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored !== null) {
          const given = stored === "true";
          if (isMounted) {
            setConsentGiven(given);
          setReady(true);
          }
          return;
        }

        if (isMounted && !ready) {
          try {
            const response = await api.get("users/consents");
            const consent = response.data.find(
              (c: { type: string; version: string }) =>
                c.type === type && c.version === version
        );
            if (!isMounted) return;

            const given = !!(consent && consent.given);
            setConsentGiven(given);
        await AsyncStorage.setItem(storageKey, given ? "true" : "false");
          } catch (error) {
            console.error("Failed to fetch consent status:", error);
            if (isMounted) {
              setConsentGiven(false);
            }
          } finally {
            if (isMounted) setReady(true);
          }
        }
      } catch (error) {
        console.error("Failed to read consent from storage:", error);
        if (isMounted) {
          setConsentGiven(false);
          setReady(true);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [ready, storageKey, type, version]);

  const giveConsent = async () => {
    setConsentGiven(true);
    await AsyncStorage.setItem(storageKey, "true");
    try {
      await api.post("users/consents", { type, version, given: true });
    } catch (error) {
      console.error("Failed to give consent:", error);
    }
  };

  const revokeConsent = async () => {
    setConsentGiven(false);
    await AsyncStorage.setItem(storageKey, "false");
    try {
      await api.delete("users/consents", { data: { type, version } });
    } catch (error) {
      console.error("Failed to revoke consent:", error);
    }
  };

  return { consentGiven, giveConsent, revokeConsent, ready };
  };

export default useConsent;
