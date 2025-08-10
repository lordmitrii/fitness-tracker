import { useState, useEffect } from "react";
import api from "../api";
import { getPolicyVersion } from "../utils/policiesUtils";

const useConsent = (type) => {
  const storageKey = `${type}_consent`;
  const [consentGiven, setConsentGiven] = useState(() => {
    return sessionStorage.getItem(storageKey) === "true";
  });

  useEffect(() => {
    let isMounted = true;
    const fetchConsent = async () => {
      try {
        const response = await api.get("users/consents");
        const consent = response.data.find(
          (consent) =>
            consent.type === type && consent.version === getPolicyVersion(type)
        );
        if (isMounted) {
          const given = !!(consent && consent.given);
          setConsentGiven(given);
          sessionStorage.setItem(storageKey, given ? "true" : "false");
        }
      } catch (error) {
        console.error("Failed to fetch consent status:", error);
      }
    };

    if (!consentGiven) {
      fetchConsent();
    }
    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  const giveConsent = async () => {
    setConsentGiven(true);
    sessionStorage.setItem(storageKey, "true");
    try {
      await api.post("users/consents", {
        type,
        version: getPolicyVersion(type),
        given: true,
      });
    } catch (error) {
      console.error("Failed to give consent:", error);
    }
  };

  const revokeConsent = async () => {
    setConsentGiven(false);
    sessionStorage.setItem(storageKey, "false");
    try {
      await api.delete("users/consents", {
        data: {
          type,
          version: getPolicyVersion(type),
        },
      });
    } catch (error) {
      console.error("Failed to revoke consent:", error);
    }
  };

  return {
    consentGiven,
    giveConsent,
    revokeConsent,
  };
};

export default useConsent;
