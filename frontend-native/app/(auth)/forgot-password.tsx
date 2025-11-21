import { useTranslation } from "react-i18next";
import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import api from "@/src/api";
import { useCooldown } from "@/src/hooks/useCooldown";
import { useTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { cooldown, start: startCooldown } = useCooldown("cooldown:forgot-password");
  const styles = createStyles(theme);

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!email) {
      setSuccess(false);
      setError(t("forgot_password.email_invalid"));
      return;
    }

    try {
      const response = await api.post("/email/send-reset-password", {
        to: email,
        language: i18n.language,
      });

      if (response.status === 200) {
        setError(null);
        setSuccess(true);
        startCooldown(60);
      } else {
        throw new Error(t("forgot_password.error_sending_email"));
      }
    } catch (error) {
      console.error("Error sending reset password email:", error);
      setSuccess(false);
      setError(t("forgot_password.error_sending_email"));
    }
  };

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("forgot_password.title") || "Forgot Password",
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
              {t("forgot_password.title")}
            </Text>
            {error && (
              <View style={[styles.errorContainer, { backgroundColor: theme.colors.status.error.background }]}>
                <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                  {error}
                </Text>
              </View>
            )}
            {success && (
              <View style={[styles.successContainer, { backgroundColor: theme.colors.status.success.background }]}>
                <Text style={[styles.successText, { color: theme.colors.status.success.text }]}>
                  {t("forgot_password.reset_link_sent")}
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
                    borderColor: theme.colors.border,
                    color: theme.colors.text.primary,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
                placeholder={t("forgot_password.email_placeholder")}
                placeholderTextColor={theme.colors.text.tertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor:
                    cooldown > 0
                      ? theme.colors.button.secondary?.background || theme.colors.card.background
                      : theme.colors.button.primary.background,
                  opacity: cooldown > 0 ? 0.6 : 1,
                  borderWidth: cooldown > 0 ? 1 : 0,
                  borderColor: cooldown > 0 ? theme.colors.border : undefined,
                },
              ]}
              onPress={handleSubmit}
              disabled={cooldown > 0}
      >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color:
                      cooldown > 0
                        ? theme.colors.button.secondary?.text || theme.colors.text.secondary
                        : theme.colors.button.primary.text,
                  },
                ]}
              >
                {cooldown > 0
                  ? `${t("forgot_password.send_reset_link")} (${cooldown})`
                  : t("forgot_password.send_reset_link")}
              </Text>
            </Pressable>
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
});

export default ForgotPassword;
