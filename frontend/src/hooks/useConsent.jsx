import { useState } from "react";

function useConsent(storageKey = "aiChatConsent") {
  const [consentGiven, setConsentGiven] = useState(
    () => localStorage.getItem(storageKey) === "true"
  );

  const giveConsent = () => {
    setConsentGiven(true);
    localStorage.setItem(storageKey, "true");
  };

  const revokeConsent = () => {
    setConsentGiven(false);
    localStorage.removeItem(storageKey);
  };

  return { consentGiven, giveConsent, revokeConsent };
}

export default useConsent;
