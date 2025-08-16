import {
  PRIVACY_POLICY_VERSION,
  HEALTH_DATA_POLICY_VERSION,
  AI_CHAT_CONSENT_VERSION,
} from "../config/versions";

const PolicyVersionsDict = {
  privacy_policy: PRIVACY_POLICY_VERSION,
  health_data: HEALTH_DATA_POLICY_VERSION,
  ai_chat: AI_CHAT_CONSENT_VERSION,
};

const getPolicyVersion = (type) => {
  return PolicyVersionsDict[type] || null;
};

export { getPolicyVersion };
