import { View, TextInput, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface UserFiltersProps {
  query: string;
  onQueryChange: (query: string) => void;
}

export default function UserFilters({
  query,
  onQueryChange,
}: UserFiltersProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={[styles.searchContainer, { backgroundColor: theme.colors.card.background, borderColor: theme.colors.border }]}>
      <MaterialIcons
        name="search"
        size={20}
        color={theme.colors.text.tertiary}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, { color: theme.colors.text.primary }]}
        value={query}
        onChangeText={onQueryChange}
        placeholder={t("admin.search_users") || "Search users..."}
        placeholderTextColor={theme.colors.text.tertiary}
        autoCapitalize="none"
      />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: theme.spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    minHeight: 40,
  },
});

