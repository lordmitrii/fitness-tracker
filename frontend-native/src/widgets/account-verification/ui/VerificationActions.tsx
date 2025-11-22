import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface VerificationActionsProps {
  showInputField: boolean;
  cooldown: number;
  pending: boolean;
  emailModified: boolean;
  onVerify: () => void;
  onSend: () => void;
}

export default function VerificationActions({
  showInputField,
  cooldown,
  pending,
  emailModified,
  onVerify,
  onSend,
}: VerificationActionsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const isDisabled = cooldown > 0 || pending || emailModified;

  return (
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
          onPress={onVerify}
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
            backgroundColor: isDisabled
              ? theme.colors.button.secondary?.background || theme.colors.card.background
              : theme.colors.button.primary.background,
            borderWidth: isDisabled ? 1 : 0,
            borderColor: isDisabled ? theme.colors.border : undefined,
            opacity: isDisabled ? 0.6 : 1,
            flex: showInputField ? 1 : undefined,
          },
        ]}
        disabled={isDisabled}
        onPress={onSend}
      >
        <Text
          style={[
            styles.buttonText,
            {
              color: isDisabled
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
  );
}

const createStyles = (theme: any) => StyleSheet.create({
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

