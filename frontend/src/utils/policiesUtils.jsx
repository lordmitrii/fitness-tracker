const PRIVACY_POLICY_VERSION = "1.0";
const HEALTH_DATA_POLICY_VERSION = "1.0";
const AI_CHAT_CONSENT_VERSION = "1.0";

const PolicyVersionsDict = {
  privacy_policy: PRIVACY_POLICY_VERSION,
  health_data: HEALTH_DATA_POLICY_VERSION,
  ai_chat: AI_CHAT_CONSENT_VERSION,
};

const getPolicyVersion = (type) => {
  return PolicyVersionsDict[type] || null;
};

export { getPolicyVersion };
