import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ErrorBannerProps {
  error: Error | null;
  message?: string;
}

export default function ErrorBanner({ error, message }: ErrorBannerProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  if (!error) return null;

  return (
    <View
      style={[
        styles.errorBanner,
        {
          backgroundColor: theme.colors.status.error.background,
        },
      ]}
    >
      <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
        {error.message || message || t("ai_chat.error_sending")}
      </Text>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  errorBanner: {
    padding: theme.spacing[3],
    marginHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[2],
  },
  errorText: {
    fontSize: theme.fontSize.base,
  },
});

