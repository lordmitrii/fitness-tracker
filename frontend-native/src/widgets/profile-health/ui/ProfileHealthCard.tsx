import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { ReactNode } from "react";

interface ProfileHealthCardProps {
  children: ReactNode;
}

export default function ProfileHealthCard({ children }: ProfileHealthCardProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        {t("profile.your_profile")}
      </Text>
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
});

