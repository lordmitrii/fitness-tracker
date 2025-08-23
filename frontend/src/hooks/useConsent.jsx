import { useState, useEffect } from "react";
import api from "../api";
import { getPolicyVersion } from "../utils/policiesUtils";

const useConsent = (type) => {
  const version = getPolicyVersion(type);
  const storageKey = `${type}_consent_v${version}`;

  const initialFromStorage = sessionStorage.getItem(storageKey);
  const [consentGiven, setConsentGiven] = useState(
    initialFromStorage === "true"
  );
  const [ready, setReady] = useState(initialFromStorage !== null);

  useEffect(() => {
    let isMounted = true;

    if (ready) return;

    (async () => {
      try {
        const response = await api.get("users/consents");
        const consent = response.data.find(
          (c) => c.type === type && c.version === version
        );
        if (!isMounted) return;

        const given = !!(consent && consent.given);
        setConsentGiven(given);
        sessionStorage.setItem(storageKey, given ? "true" : "false");
      } catch (error) {
        console.error("Failed to fetch consent status:", error);
        setConsentGiven(false);
      } finally {
        if (isMounted) setReady(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [ready, storageKey, type, version]);

  const giveConsent = async () => {
    setConsentGiven(true);
    sessionStorage.setItem(storageKey, "true");
    try {
      await api.post("users/consents", { type, version, given: true });
    } catch (error) {
      console.error("Failed to give consent:", error);
    }
  };

  const revokeConsent = async () => {
    setConsentGiven(false);
    sessionStorage.setItem(storageKey, "false");
    try {
      await api.delete("users/consents", { data: { type, version } });
    } catch (error) {
      console.error("Failed to revoke consent:", error);
    }
  };

  return { consentGiven, giveConsent, revokeConsent, ready };
};

export default useConsent;
