import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import api from "@/src/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ResetPassword = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [linkValid, setLinkValid] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(theme);

  useEffect(() => {
    const verifyToken = async () => {
      setLoading(true);
      setError(null);

      if (!token) {
        setLinkValid(false);
        setLoading(false);
        return;
      }

      try {
        const response = await api.post("/email/validate-token", {
          token,
          token_type: "reset_password",
        });

        if (response.status !== 200) {
          setLinkValid(false);
          return;
        }

        setLinkValid(true);
      } catch (error) {
        setLinkValid(false);
        console.error("Error verifying token:", error);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  const validatePasswords = () => {
    if (password !== confirmPassword) {
      setError(t("reset_password.passwords_mismatch"));
      return false;
    }

    if (password.length < 8) {
      setError(t("reset_password.password_min_length", { minLength: 8 }));
      return false;
    } else if (password.length > 128) {
      setError(t("reset_password.password_too_long", { limit: 128 }));
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePasswords()) {
      return;
    }

    try {
      const response = await api.post("/email/reset-password", {
        token,
        new_password: password,
      });

      if (response.status === 200) {
        await AsyncStorage.setItem("hasLoaded", "1");
        router.replace("/(auth)/login");
      } else {
        setError(t("reset_password.reset_failed"));
        console.error("Password reset failed:", response.data);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError(t("reset_password.reset_failed"));
    }
  };

  if (loading)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("reset_password.title") || "Reset Password",
          })}
        />
        <LoadingState message={t("reset_password.verifying_link")} />
      </>
    );
  if (!linkValid)
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("reset_password.title") || "Reset Password",
          })}
        />
        <ErrorState
          error={t("reset_password.invalid_link")}
          onRetry={() => router.replace("/(auth)/forgot-password")}
        />
      </>
    );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("reset_password.title") || "Reset Password",
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
              {t("reset_password.title")}
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
                {t("reset_password.new_password_label")}
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
                value={password}
                onChangeText={setPassword}
                placeholder={t("reset_password.new_password_placeholder")}
                placeholderTextColor={theme.colors.text.tertiary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="newPassword"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                {t("reset_password.confirm_password_label")}
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
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder={t("reset_password.confirm_password_placeholder")}
                placeholderTextColor={theme.colors.text.tertiary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="newPassword"
              />
            </View>

            <Pressable
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.button.primary.background,
                },
              ]}
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
                {t("reset_password.reset_password_button")}
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

export default ResetPassword;
