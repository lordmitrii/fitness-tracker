import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import LanguageSwitcher from "@/src/shared/ui/LanguageSwitcher";

export default function MoreScreenHeader() {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        Fitness Tracker
      </Text>
      <View style={styles.headerActions}>
        <LanguageSwitcher />
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.spacing[2],
    marginBottom: theme.spacing[2],
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: "bold",
  },
  headerActions: {
    flexDirection: "row",
    gap: theme.spacing[2],
  },
});

