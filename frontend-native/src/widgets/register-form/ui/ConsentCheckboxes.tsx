import { View, Text, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation, Trans } from "react-i18next";
import { CheckBox } from "@/src/shared/ui/CheckBox";

interface ConsentCheckboxesProps {
  privacyConsent: boolean;
  healthDataConsent: boolean;
  onPrivacyConsentChange: (checked: boolean) => void;
  onHealthDataConsentChange: (checked: boolean) => void;
  errors: Record<string, string>;
}

export default function ConsentCheckboxes({
  privacyConsent,
  healthDataConsent,
  onPrivacyConsentChange,
  onHealthDataConsentChange,
  errors,
}: ConsentCheckboxesProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <>
      <View style={styles.consentContainer}>
        <View style={styles.consentRow}>
          <CheckBox
            checked={privacyConsent}
            onChange={(checked) => {
              onPrivacyConsentChange(checked);
            }}
          />
          <View style={styles.consentTextContainer}>
            <Text style={[styles.consentText, { color: theme.colors.text.secondary }]}>
              <Trans
                i18nKey="register_form.privacy_policy_consent"
                components={[
                  <Pressable
                    key="privacy-policy-link"
                    onPress={() => router.push("/(policies)/privacy-policy")}
                  >
                    <Text style={[styles.link, { color: theme.colors.button.primary.background }]}>
                      {t("register_form.privacy_policy")}
                    </Text>
                  </Pressable>,
                ]}
              />
            </Text>
          </View>
        </View>
        {(errors.privacyConsent || errors.healthDataConsent) && (
          <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
            {errors.privacyConsent || "\u00A0"}
          </Text>
        )}
      </View>

      <View style={styles.consentContainer}>
        <View style={styles.consentRow}>
          <CheckBox
            checked={healthDataConsent}
            onChange={(checked) => {
              onHealthDataConsentChange(checked);
            }}
          />
          <View style={styles.consentTextContainer}>
            <Text style={[styles.consentText, { color: theme.colors.text.secondary }]}>
              <Trans
                i18nKey="register_form.health_data_consent"
                components={[
                  <Pressable
                    key="health-data-policy-link"
                    onPress={() => router.push("/(policies)/health-data-policy")}
                  >
                    <Text style={[styles.link, { color: theme.colors.button.primary.background }]}>
                      {t("register_form.health_data_policy")}
                    </Text>
                  </Pressable>,
                ]}
              />
            </Text>
          </View>
        </View>
        {(errors.healthDataConsent || errors.privacyConsent) && (
          <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
            {errors.healthDataConsent || "\u00A0"}
          </Text>
        )}
      </View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  consentContainer: {
    gap: theme.spacing[1],
  },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing[2],
  },
  consentTextContainer: {
    flex: 1,
  },
  consentText: {
    fontSize: theme.fontSize.sm,
    lineHeight: 18,
  },
  link: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  fieldError: {
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[1],
  },
});

