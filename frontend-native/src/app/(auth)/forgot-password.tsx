import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";

import {
  ForgotPasswordFormCard,
  ForgotPasswordFormFields,
  ForgotPasswordFormActions,
} from "@/src/widgets/forgot-password-form";
import { useForgotPassword } from "@/src/features/auth/forgot-password";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    email,
    error,
    success,
    cooldown,
    setEmail,
    handleSubmit,
  } = useForgotPassword();

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
          <ForgotPasswordFormCard error={error} success={success}>
            <ForgotPasswordFormFields
              email={email}
              onEmailChange={setEmail}
            />

            <ForgotPasswordFormActions
              onSubmit={handleSubmit}
              cooldown={cooldown}
            />
          </ForgotPasswordFormCard>
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

export default ForgotPassword;
