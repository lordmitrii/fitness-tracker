import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams, Stack, Redirect } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import api from "@/src/api";
import { useCooldown } from "@/src/hooks/useCooldown";
import { useAuth } from "@/src/context/AuthContext";
import useStorageObject from "@/src/hooks/useStorageObject";

const AccountVerification = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { user, refresh, isAuth, hasRole } = useAuth();
  const { registering } = useLocalSearchParams<{ registering?: string }>();
  const isRegistering = registering === "true";
  
  const [email, setEmail] = useState(user?.email ?? "");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [codeValue, setCodeValue] = useState("");
  const [persisted, setPersisted] = useStorageObject("accountVerification:state", {
    showInputField: false,
  });
  const styles = createStyles(theme);
  const { cooldown, start: startCooldown } = useCooldown("cooldown:account-verification");
  const showInputField = persisted.showInputField;
  const [pending, setPending] = useState(false);

  const emailModified = useMemo(() => user?.email !== email, [user?.email, email]);

  if (!isAuth) return <Redirect href="/(auth)/login" />;
  if (!hasRole("restricted")) return <Redirect href="/(tabs)" />;

  const handleSave = async () => {
    if (pending) return;
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setError(t("account_verification.email_required"));
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t("account_verification.email_invalid"));
      return;
    } else if (email.length > 255) {
      setError(t("account_verification.email_too_long", { limit: 255 }));
      return;
    }

    setPending(true);
    setPersisted((prev) => ({ ...prev, showInputField: false }));
    try {
      await api.patch("users/accounts", { email });
      setEmail(email);
      if (user) {
        user.email = email;
      }
    } catch (error) {
      console.error("Error updating verification email:", error);
      setSuccessMessage(null);
      setError(t("account_verification.error_updating_email"));
    } finally {
      setPending(false);
    }
  };

  const handleSend = async () => {
    if (pending) return;
    setError(null);
    setSuccessMessage(null);

    if (!email) {
      setSuccessMessage(null);
      setError(t("account_verification.email_required"));
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setSuccessMessage(null);
      setError(t("account_verification.email_invalid"));
      return;
    } else if (email.length > 255) {
      setSuccessMessage(null);
      setError(t("account_verification.email_too_long", { limit: 255 }));
      return;
    }

    setPending(true);

    try {
      const response = await api.post("/email/send-account-verification", {
        to: email,
        language: i18n.language,
      });

      if (response.status === 200) {
        setError(null);
        setSuccessMessage(t("account_verification.code_sent"));
        setPersisted((prev) => ({ ...prev, showInputField: true }));
        startCooldown(60);
      } else {
        throw new Error(t("account_verification.error_sending_email"));
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      setError(t("account_verification.error_sending_email"));
    } finally {
      setPending(false);
    }
  };

  const handleVerify = async () => {
    if (pending || !codeValue) return;
    setPending(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await api.post("/email/verify-account", {
        token: codeValue,
      });
      if (response.status === 200) {
        await refresh();
        setSuccessMessage(t("account_verification.verification_success"));
        setPersisted((prev) => ({ ...prev, showInputField: false }));
        
        if (isRegistering) {
          router.replace("/(auth)/login");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        throw new Error(t("account_verification.error_verifying"));
      }
    } catch (error) {
      console.error("Error verifying the code:", error);
      setError(t("account_verification.error_verifying"));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("account_verification.title") || "Account Verification",
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
              {t("account_verification.title")}
            </Text>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.status.error.background }]}>
                <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                  {error}
                </Text>
              </View>
            )}
            {successMessage && (
              <View style={[styles.successContainer, { backgroundColor: theme.colors.status.success.background }]}>
                <Text style={[styles.successText, { color: theme.colors.status.success.text }]}>
                  {successMessage}
                </Text>
              </View>
            )}

            <View style={styles.inputContainer}>
              <View style={styles.emailHeader}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  {t("general.email")}
                </Text>
                {emailModified && (
                  <Pressable onPress={handleSave} disabled={pending}>
                    <Text style={[styles.saveButton, { color: theme.colors.button.primary.background }]}>
                      {t("general.save")}
                    </Text>
                  </Pressable>
                )}
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                    borderColor: theme.colors.border,
                    color: theme.colors.text.primary,
                    opacity: (!emailModified || pending) ? 0.5 : 1,
                  },
                ]}
                editable={!pending}
                value={email}
                onChangeText={(value) => {
                  setPersisted((prev) => ({ ...prev, showInputField: false }));
                  setEmail(value);
                }}
                placeholder={t("account_verification.email_placeholder")}
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            {showInputField && (
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  {t("account_verification.code_label")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.input?.background || theme.colors.card.background,
                      borderColor: theme.colors.border,
                      color: theme.colors.text.primary,
                    },
                  ]}
                  value={codeValue}
                  onChangeText={setCodeValue}
                  placeholder={t("account_verification.code_placeholder")}
                  placeholderTextColor={theme.colors.text.tertiary}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  autoComplete="off"
                />
              </View>
            )}

            <View style={styles.buttonRow}>
              {showInputField && (
                <Pressable
                  style={[
                    styles.button,
                    styles.verifyButton,
                    {
                      backgroundColor:
                        pending || emailModified
                          ? theme.colors.button.secondary?.background || theme.colors.card.background
                          : theme.colors.button.primary.background,
                      borderWidth: pending || emailModified ? 1 : 0,
                      borderColor: pending || emailModified ? theme.colors.border : undefined,
                      opacity: (pending || emailModified) ? 0.6 : 1,
                    },
                  ]}
                  disabled={pending || emailModified}
                  onPress={handleVerify}
      >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color:
                          pending || emailModified
                            ? theme.colors.button.secondary?.text || theme.colors.text.secondary
                            : theme.colors.button.primary.text,
                      },
                    ]}
                  >
                    {t("account_verification.verify")}
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={[
                  styles.button,
                  styles.sendButton,
                  {
                    backgroundColor:
                      cooldown > 0 || pending || emailModified
                        ? theme.colors.button.secondary?.background || theme.colors.card.background
                        : theme.colors.button.primary.background,
                    borderWidth: cooldown > 0 || pending || emailModified ? 1 : 0,
                    borderColor: cooldown > 0 || pending || emailModified ? theme.colors.border : undefined,
                    opacity: (cooldown > 0 || pending || emailModified) ? 0.6 : 1,
                    flex: showInputField ? 1 : undefined,
                  },
                ]}
                disabled={cooldown > 0 || pending || emailModified}
                onPress={handleSend}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color:
                        cooldown > 0 || pending || emailModified
                          ? theme.colors.button.secondary?.text || theme.colors.text.secondary
                          : theme.colors.button.primary.text,
                    },
                  ]}
                >
                  {cooldown > 0
                    ? `${showInputField ? t("account_verification.resend_code") : t("account_verification.send_code")} (${cooldown})`
                    : showInputField
                    ? t("account_verification.resend_code")
                    : t("account_verification.send_code")}
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
    justifyContent: "center",
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
  successContainer: {
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.lg,
  },
  successText: {
    fontSize: theme.fontSize.base,
  },
  inputContainer: {
    gap: theme.spacing[2],
  },
  emailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  saveButton: {
    fontSize: theme.fontSize.sm,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  input: {
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3],
    fontSize: theme.fontSize.md,
    minHeight: 44,
  },
  buttonRow: {
    flexDirection: "row",
    gap: theme.spacing[3],
  },
  button: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[3.5],
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  verifyButton: {
    flex: 3,
  },
  sendButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});

export default AccountVerification;
