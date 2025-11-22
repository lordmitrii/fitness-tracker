import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/shared/ui/states";

import { UserList, UserEditModal, UserFilters } from "@/src/widgets/admin-users";
import { useUserManagement } from "@/src/features/admin/user-management";
import { useRoleAssignment } from "@/src/features/admin/role-assignment";

const PAGE_SIZE = 20;

export default function UsersScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const { users, total, loading, error, refetch, pageSize } = useUserManagement({
    searchQuery: search,
    page,
  });

  const {
    allRoles,
    selectedRoleNames,
    savingRoles,
    editUserRoles,
    toggleRole,
    saveRoles,
    reset,
  } = useRoleAssignment({
    onSuccess: () => {
      setEditingUser(null);
      refetch();
    },
  });

  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 500);
    return () => clearTimeout(id);
  }, [query]);

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    editUserRoles(user);
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    try {
      await saveRoles(editingUser.id);
    } catch (err) {
      console.error("Error saving roles:", err);
    }
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    reset();
  };

  if (loading && users.length === 0) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("admin.users") || "Users",
          })}
        />
        <LoadingState message={t("admin.loading_users") || "Loading users..."} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("admin.users") || "Users",
          })}
        />
        <ErrorState error={error} onRetry={refetch} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("admin.users") || "Users",
        })}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <UserFilters query={query} onQueryChange={setQuery} />

        <UserList
          users={users}
          total={total}
          page={page}
          pageSize={pageSize}
          onLoadMore={() => setPage((p) => p + 1)}
          onEditUser={handleEditUser}
        />

        <UserEditModal
          visible={!!editingUser}
          user={editingUser}
          allRoles={allRoles}
          selectedRoleNames={selectedRoleNames}
          saving={savingRoles}
          onClose={handleCloseModal}
          onToggleRole={toggleRole}
          onSave={handleSaveRoles}
        />
      </View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
});
