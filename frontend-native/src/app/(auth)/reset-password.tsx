import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";

import {
  ResetPasswordFormCard,
  ResetPasswordFormFields,
  ResetPasswordFormActions,
} from "@/src/widgets/reset-password-form";
import { useResetPassword } from "@/src/features/auth/reset-password";

const ResetPassword = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const styles = createStyles(theme);

  const {
    linkValid,
    password,
    confirmPassword,
    loading,
    error,
    setPassword,
    setConfirmPassword,
    handleSubmit,
  } = useResetPassword(token);

  if (loading) {
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
  }

  if (!linkValid) {
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
  }

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
          <ResetPasswordFormCard error={error}>
            <ResetPasswordFormFields
              password={password}
              confirmPassword={confirmPassword}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
            />

            <ResetPasswordFormActions onSubmit={handleSubmit} />
          </ResetPasswordFormCard>
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

export default ResetPassword;
