import { useAuth } from "@/src/context/AuthContext";
import { useCallback, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Linking } from "react-native";
import { router, Stack } from "expo-router";
import { useTranslation, Trans } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import CheckBox from "@/src/components/CheckBox";
import useVersionsData from "@/src/hooks/data/userVersionsData";

const RegisterForm = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { login, register, isRefreshing, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [healthDataConsent, setHealthDataConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(theme);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { getVersion } = useVersionsData({ skipQuery: false });

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = t("register_form.email_required");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t("register_form.email_invalid");
    } else if (email.length > 255) {
      newErrors.email = t("register_form.email_too_long", { limit: 255 });
    }

    if (!username) {
      newErrors.username = t("register_form.username_required");
    } else if (username.length < 6) {
      newErrors.username = t("register_form.username_min_length", { minLength: 6 });
    } else if (username.length > 50) {
      newErrors.username = t("register_form.username_too_long", { limit: 50 });
    }

    if (!password) {
      newErrors.password = t("register_form.password_required");
    } else if (password.length < 8) {
      newErrors.password = t("register_form.password_min_length", { minLength: 8 });
    } else if (password.length > 128) {
      newErrors.password = t("register_form.password_too_long", { limit: 128 });
    }

    if (!privacyConsent) {
      newErrors.privacyConsent = t("register_form.privacy_policy_consent_missing");
    }

    if (!healthDataConsent) {
      newErrors.healthDataConsent = t("register_form.health_data_consent_missing");
    }

    return newErrors;
  }, [email, username, password, privacyConsent, healthDataConsent, t]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setFormErrors({});

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const healthDataConsentVersion = getVersion("healthDataPolicy");
    const privacyConsentVersion = getVersion("privacyPolicy");

    const resp = await register(
      username,
      email,
      password,
      privacyConsent,
      privacyConsentVersion,
      healthDataConsent,
      healthDataConsentVersion
    );
    
    if (!resp?.message) {
      const loginResp = await login(username, password);
      if (!loginResp?.message) {
        router.replace("/(auth)/account-verification?registering=true");
      } else {
        router.replace("/(auth)/login");
      }
    } else {
      setError(resp.message);
    }
  }, [email, username, password, privacyConsent, healthDataConsent, validateForm, register, login, getVersion]);

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.register") || "Register",
        })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {t("register_form.register_title")}
            </Text>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.status.error.background }]}>
                <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                {t("general.email")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                    borderColor: formErrors.email ? theme.colors.status.error.text : theme.colors.border,
                    color: theme.colors.text.primary,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder="username@example.com"
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
              {formErrors.email && (
                <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
                  {formErrors.email}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                {t("general.username")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                    borderColor: formErrors.username ? theme.colors.status.error.text : theme.colors.border,
                    color: theme.colors.text.primary,
                  },
                ]}
                value={username}
                onChangeText={setUsername}
                placeholder="user123"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
              />
              {formErrors.username && (
                <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
                  {formErrors.username}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                {t("general.password")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                    borderColor: formErrors.password ? theme.colors.status.error.text : theme.colors.border,
                    color: theme.colors.text.primary,
                  },
                ]}
                value={password}
                onChangeText={setPassword}
                placeholder={t("register_form.password_placeholder")}
                placeholderTextColor={theme.colors.text.tertiary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="newPassword"
              />
              {formErrors.password && (
                <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
                  {formErrors.password}
                </Text>
              )}
            </View>

            <View style={styles.consentContainer}>
              <View style={styles.consentRow}>
                <CheckBox
                  checked={privacyConsent}
                  onChange={(checked) => {
                    setPrivacyConsent(checked);
                    setFormErrors((prev) => ({ ...prev, privacyConsent: "" }));
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
              {(formErrors.privacyConsent || formErrors.healthDataConsent) && (
                <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
                  {formErrors.privacyConsent || "\u00A0"}
                </Text>
              )}
            </View>

            <View style={styles.consentContainer}>
              <View style={styles.consentRow}>
                <CheckBox
                  checked={healthDataConsent}
                  onChange={(checked) => {
                    setHealthDataConsent(checked);
                    setFormErrors((prev) => ({ ...prev, healthDataConsent: "" }));
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
              {(formErrors.healthDataConsent || formErrors.privacyConsent) && (
                <Text style={[styles.fieldError, { color: theme.colors.status.error.text }]}>
                  {formErrors.healthDataConsent || "\u00A0"}
                </Text>
              )}
            </View>

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.button.primary.background,
                  opacity: (isRefreshing || loading) ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isRefreshing || loading}
            >
              <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
                {t("general.continue")}
              </Text>
            </Pressable>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: theme.colors.text.secondary }]}>
                {t("register_form.already_have_account")}{" "}
              </Text>
              <Pressable onPress={() => router.push("/(auth)/login")}>
                <Text style={[styles.link, { color: theme.colors.button.primary.background }]}>
                  {t("general.login")}
                </Text>
              </Pressable>
            </View>
      </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.spacing[4],
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[6],
    borderWidth: 1,
    gap: theme.spacing[6],
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.spacing[2],
  },
  errorContainer: {
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  errorText: {
    fontSize: theme.fontSize.base,
  },
  inputContainer: {
    gap: theme.spacing[2],
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    fontSize: theme.fontSize.md,
    minHeight: 44,
  },
  fieldError: {
    fontSize: theme.fontSize.sm,
    marginTop: theme.spacing[1],
  },
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
  button: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3.5],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing[2],
  },
  loginText: {
    fontSize: theme.fontSize.base,
  },
});

export default RegisterForm;
