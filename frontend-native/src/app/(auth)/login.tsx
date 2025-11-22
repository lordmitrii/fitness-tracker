import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";

import {
  LoginFormCard,
  LoginFormFields,
  LoginFormActions,
} from "@/src/widgets/login-form";
import { useLoginForm } from "@/src/features/auth/login";

const LoginForm = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    username,
    password,
    error,
    isSubmitting,
    setUsername,
    setPassword,
    handleSubmit,
  } = useLoginForm();

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
          <LoginFormCard error={error}>
            <LoginFormFields
              username={username}
              password={password}
              onUsernameChange={setUsername}
              onPasswordChange={setPassword}
            />

            <LoginFormActions
              onSubmit={handleSubmit}
              disabled={isSubmitting}
            />
          </LoginFormCard>
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
});

export default LoginForm;
