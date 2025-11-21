import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import api from "@/src/api";
import PullToRefresh from "@/src/components/common/PullToRefresh";

type Role = {
  id: number;
  name: string;
};

export default function RolesScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const styles = createStyles(theme);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/roles");
      setRoles(res.data || []);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleRefresh = useCallback(async () => {
    await loadRoles();
  }, [loadRoles]);

  if (loading && roles.length === 0) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("admin.roles") || "Roles",
          })}
        />
        <LoadingState message={t("admin.loading_roles") || "Loading roles..."} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("admin.roles") || "Roles",
          })}
        />
        <ErrorState error={error} onRetry={loadRoles} />
      </>
    );
  }

  const renderRole = ({ item: role }: { item: Role }) => (
    <View
      style={[
        styles.roleCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.roleInfo}>
        <Text style={[styles.roleName, { color: theme.colors.text.primary }]}>
          {role.name}
        </Text>
        <Text style={[styles.roleId, { color: theme.colors.text.tertiary }]}>
          ID: {role.id}
        </Text>
      </View>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("admin.roles") || "Roles",
        })}
      />
      <PullToRefresh onRefresh={handleRefresh}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          {roles.length > 0 ? (
            <FlatList
              data={roles}
              renderItem={renderRole}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              style={styles.list}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {t("admin.no_roles_found") || "No roles found"}
              </Text>
            </View>
          )}
        </View>
      </PullToRefresh>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  roleCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    borderWidth: 1,
    gap: theme.spacing[2],
  },
  roleInfo: {
    gap: theme.spacing[1],
  },
  roleName: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  roleId: {
    fontSize: theme.fontSize.sm,
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
