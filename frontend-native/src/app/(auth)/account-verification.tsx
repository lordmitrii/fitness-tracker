import { ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useLocalSearchParams, router, Stack, Redirect } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useAuth } from "@/src/shared/lib/context/AuthContext";

import {
  AccountVerificationCard,
  EmailInputField,
  VerificationCodeField,
  VerificationActions,
} from "@/src/widgets/account-verification";
import { useAccountVerification } from "@/src/features/auth/account-verification";

const AccountVerification = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { isAuth, hasRole } = useAuth();
  const { registering } = useLocalSearchParams<{ registering?: string }>();
  const isRegistering = registering === "true";
  const styles = createStyles(theme);

  const {
    email,
    codeValue,
    error,
    successMessage,
    cooldown,
    pending,
    emailModified,
    showInputField,
    setCodeValue,
    handleEmailChange,
    handleSave,
    handleSend,
    handleVerify,
  } = useAccountVerification(isRegistering);

  if (!isAuth) return <Redirect href="/(auth)/login" />;
  if (!hasRole("restricted")) return <Redirect href="/(tabs)" />;

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
          <AccountVerificationCard error={error} successMessage={successMessage}>
            <EmailInputField
              email={email}
              emailModified={emailModified}
              pending={pending}
              onEmailChange={handleEmailChange}
              onSave={handleSave}
            />

            {showInputField && (
              <VerificationCodeField
                code={codeValue}
                onCodeChange={setCodeValue}
              />
            )}

            <VerificationActions
              showInputField={showInputField}
              cooldown={cooldown}
              pending={pending}
              emailModified={emailModified}
              onVerify={handleVerify}
              onSend={handleSend}
            />
          </AccountVerificationCard>
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

export default AccountVerification;
