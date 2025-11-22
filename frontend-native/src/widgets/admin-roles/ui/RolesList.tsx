import { View, Text, FlatList, StyleSheet, RefreshControl } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import RoleCard from "./RoleCard";

interface Role {
  id: number;
  name: string;
}

interface RolesListProps {
  roles: Role[];
  refreshing: boolean;
  onRefresh: () => void;
}

export default function RolesList({
  roles,
  refreshing,
  onRefresh,
}: RolesListProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <FlatList
      data={roles}
      renderItem={({ item }) => <RoleCard role={item} />}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={[
        styles.listContent,
        roles.length === 0 && styles.emptyListContent,
      ]}
      style={[styles.list, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.button.primary.background}
          colors={[theme.colors.button.primary.background]}
          progressBackgroundColor={theme.colors.background}
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            {t("admin.no_roles_found") || "No roles found"}
          </Text>
        </View>
      }
    />
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing[4],
    gap: theme.spacing[3],
    flexGrow: 1,
  },
  emptyListContent: {
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing[8],
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    textAlign: "center",
  },
});

