import {
  PRIVACY_POLICY_VERSION,
  HEALTH_DATA_POLICY_VERSION,
  AI_CHAT_CONSENT_VERSION,
  TERMS_AND_CONDITIONS_VERSION,
} from "../config/versions";

const PolicyVersionsDict = {
  privacy_policy: PRIVACY_POLICY_VERSION,
  health_data: HEALTH_DATA_POLICY_VERSION,
  terms_and_conditions: TERMS_AND_CONDITIONS_VERSION,
  ai_chat: AI_CHAT_CONSENT_VERSION,
};

const getPolicyVersion = (type) => {
  return PolicyVersionsDict[type] || null;
};

export { getPolicyVersion };
