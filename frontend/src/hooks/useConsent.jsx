import { useState, useEffect } from "react";
import api from "../api";
import { AI_CHAT_CONSENT_VERSION } from "../utils/policiesUtils";

const useConsent = (storageKey = "aiChatConsent") => {
  const [consentGiven, setConsentGiven] = useState(() => {
    return sessionStorage.getItem(storageKey) === "true";
  });

  useEffect(() => {
    let isMounted = true;
    const fetchConsent = async () => {
      try {
        const response = await api.get("users/consents");
        const aiConsent = response.data.find(
          (consent) =>
            consent.type === "ai_chat" &&
            consent.version === AI_CHAT_CONSENT_VERSION
        );
        if (isMounted) {
          const given = !!(aiConsent && aiConsent.given);
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
        type: "ai_chat",
        version: AI_CHAT_CONSENT_VERSION,
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
          type: "ai_chat",
          version: AI_CHAT_CONSENT_VERSION,
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
