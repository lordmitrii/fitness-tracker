import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";

interface ResetPasswordFormCardProps {
  children: ReactNode;
  error?: string | null;
}

export default function ResetPasswordFormCard({
  children,
  error,
}: ResetPasswordFormCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
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
      {children}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
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
});

