import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";

import {
  RegisterFormCard,
  RegisterFormFields,
  ConsentCheckboxes,
  RegisterFormActions,
} from "@/src/widgets/register-form";
import { useRegisterForm } from "@/src/features/auth/register";

const RegisterForm = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const {
    email,
    username,
    password,
    privacyConsent,
    healthDataConsent,
    error,
    formErrors,
    isSubmitting,
    setEmail,
    setUsername,
    setPassword,
    setPrivacyConsent,
    setHealthDataConsent,
    handleSubmit,
    clearFieldError,
  } = useRegisterForm();

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
          <RegisterFormCard error={error}>
            <RegisterFormFields
              email={email}
              username={username}
              password={password}
              onEmailChange={(value) => {
                setEmail(value);
                clearFieldError("email");
              }}
              onUsernameChange={(value) => {
                setUsername(value);
                clearFieldError("username");
              }}
              onPasswordChange={(value) => {
                setPassword(value);
                clearFieldError("password");
              }}
              errors={formErrors}
            />

            <ConsentCheckboxes
              privacyConsent={privacyConsent}
              healthDataConsent={healthDataConsent}
              onPrivacyConsentChange={(checked) => {
                setPrivacyConsent(checked);
                clearFieldError("privacyConsent");
              }}
              onHealthDataConsentChange={(checked) => {
                setHealthDataConsent(checked);
                clearFieldError("healthDataConsent");
              }}
              errors={formErrors}
            />

            <RegisterFormActions
              onSubmit={handleSubmit}
              disabled={isSubmitting}
            />
          </RegisterFormCard>
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
});

export default RegisterForm;
