import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ConsentBannerProps {
  onAccept: () => void;
  message?: string;
  acceptLabel?: string;
}

export default function ConsentBanner({
  onAccept,
  message,
  acceptLabel,
}: ConsentBannerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View
      style={[
        styles.consentBanner,
        {
          backgroundColor: theme.colors.button.warning.background,
        },
      ]}
    >
      <Text style={[styles.consentText, { color: theme.colors.button.warning.text }]}>
        {message || t("ai_chat.consent_required") || "AI Chat requires privacy consent"}
      </Text>
      <Pressable
        style={[
          styles.consentButton,
          {
            backgroundColor: theme.colors.button.primary.background,
          },
        ]}
        onPress={onAccept}
      >
        <Text
          style={[
            styles.consentButtonText,
            { color: theme.colors.button.primary.text },
          ]}
        >
          {acceptLabel || t("general.accept") || "Accept"}
        </Text>
      </Pressable>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  consentBanner: {
    padding: theme.spacing[4],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  consentText: {
    flex: 1,
    fontSize: theme.fontSize.base,
  },
  consentButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
  },
  consentButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
});

