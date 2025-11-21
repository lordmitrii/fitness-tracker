import { useState, useCallback } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useAuth } from "@/src/context/AuthContext";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { Stack } from "expo-router";
import { createHeaderOptions } from "@/src/navigation/headerConfig";

const LoginForm = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { login, isRefreshing, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const styles = createStyles(theme);

  const handleSubmit = useCallback(async () => {
    setError(null);
    try {
      const resp = await login(username, password);
      if (!resp?.message) {
        router.replace("/(tabs)");
      } else {
        setError(resp.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [username, password, login]);

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.login") || "Login",
        })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {t("login_form.login_title")}
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
                {t("general.username")}
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
                value={username}
                onChangeText={setUsername}
                placeholder="user1234"
                placeholderTextColor={theme.colors.text.tertiary}
                autoCapitalize="none"
                autoComplete="username"
                textContentType="username"
              />
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.passwordHeader}>
                <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                  {t("general.password")}
                </Text>
                <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                  <Text style={[styles.link, { color: theme.colors.button.primary.background }]}>
                    {t("login_form.forgot_password")}
                  </Text>
                </Pressable>
              </View>
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
                placeholder={t("login_form.password_placeholder")}
                placeholderTextColor={theme.colors.text.tertiary}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
              />
            </View>

            <Pressable
              style={[
                styles.button,
                styles.primaryButton,
                {
                  backgroundColor: theme.colors.button.primary.background,
                  opacity: (isRefreshing || loading) ? 0.6 : 1,
                },
              ]}
              onPress={handleSubmit}
              disabled={isRefreshing || loading}
      >
              <Text style={[styles.buttonText, { color: theme.colors.button.primary.text }]}>
                {t("general.login")}
              </Text>
            </Pressable>

            <View style={styles.registerContainer}>
              <Text style={[styles.registerText, { color: theme.colors.text.secondary }]}>
                {t("login_form.not_registered")}{" "}
              </Text>
              <Pressable onPress={() => router.push("/(auth)/register")}>
                <Text style={[styles.link, { color: theme.colors.button.primary.background }]}>
                  {t("general.register")}
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
  inputContainer: {
    gap: theme.spacing[2],
  },
  label: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  primaryButton: {},
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: theme.spacing[2],
  },
  registerText: {
    fontSize: theme.fontSize.base,
  },
  link: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default LoginForm;
