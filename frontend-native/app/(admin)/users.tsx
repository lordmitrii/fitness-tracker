import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import { LoadingState, ErrorState } from "@/src/states";
import api from "@/src/api";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal } from "react-native";
import CheckBox from "@/src/components/CheckBox";

const PAGE_SIZE = 20;

export default function UsersScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const styles = createStyles(theme);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);
  const [savingRoles, setSavingRoles] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setSearch(query.trim()), 500);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/roles")
      .then((res) => !cancelled && setAllRoles(res.data || []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setError(null);
    api
      .get("/admin/users", {
        params: {
          q: search || undefined,
          page,
          page_size: PAGE_SIZE,
        },
      })
      .then((res) => {
        setUsers(res.data?.users || []);
        setTotal(res.data?.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, [search, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleEditRoles = (user: any) => {
    setEditingUser(user);
    setSelectedRoleNames(user.roles?.map((r: any) => r.name) || []);
  };

  const handleToggleRole = (roleName: string) => {
    setSelectedRoleNames((prev) => {
      if (prev.includes(roleName)) {
        return prev.filter((name) => name !== roleName);
      }
      return [...prev, roleName];
    });
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    setSavingRoles(true);
    try {
      await api.post(`/admin/users/${editingUser.id}/roles`, {
        role_names: selectedRoleNames,
      });
      setEditingUser(null);
      setSelectedRoleNames([]);
      loadUsers();
    } catch (err) {
      console.error("Error saving roles:", err);
    } finally {
      setSavingRoles(false);
    }
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setSelectedRoleNames([]);
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
        <ErrorState error={error} onRetry={loadUsers} />
      </>
    );
  }

  const renderUser = ({ item: user }: { item: any }) => (
    <View
      style={[
        styles.userCard,
        {
          backgroundColor: theme.colors.card.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.colors.text.primary }]}>
          {user.username || user.email}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.text.secondary }]}>
          {user.email}
        </Text>
        <View style={styles.rolesContainer}>
          {user.roles?.map((role: any) => (
            <View
              key={role.id || role.name}
              style={[
                styles.roleBadge,
                {
                  backgroundColor: theme.colors.button.secondary?.background || theme.colors.card.background,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text style={[styles.roleText, { color: theme.colors.text.secondary }]}>
                {role.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <Pressable
        onPress={() => handleEditRoles(user)}
        style={styles.editButton}
      >
        <MaterialIcons
          name="edit"
          size={20}
          color={theme.colors.button.primary.background}
        />
      </Pressable>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("admin.users") || "Users",
        })}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            onChangeText={setQuery}
            placeholder={t("admin.search_users") || "Search users..."}
            placeholderTextColor={theme.colors.text.tertiary}
            autoCapitalize="none"
          />
        </View>

        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                {t("admin.no_users_found") || "No users found"}
              </Text>
            </View>
          }
          ListFooterComponent={
            total > page * PAGE_SIZE ? (
              <Pressable
                style={[styles.loadMoreButton, { backgroundColor: theme.colors.button.secondary?.background }]}
                onPress={() => setPage((p) => p + 1)}
              >
                <Text style={[styles.loadMoreText, { color: theme.colors.button.secondary?.text }]}>
                  {t("general.load_more") || "Load More"}
                </Text>
              </Pressable>
            ) : null
          }
        />

        {editingUser && (
          <Modal
            visible={!!editingUser}
            transparent
            animationType="slide"
            onRequestClose={() => setEditingUser(null)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.colors.card.background,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                    {t("admin.edit_roles") || "Edit Roles"}
                  </Text>
                  <Pressable onPress={handleCloseModal}>
                    <MaterialIcons
                      name="close"
                      size={24}
                      color={theme.colors.text.primary}
                    />
                  </Pressable>
                </View>
                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                  {editingUser.username || editingUser.email}
                </Text>
                <ScrollView style={styles.rolesList} contentContainerStyle={styles.rolesListContent}>
                  {allRoles.map((role) => (
                    <Pressable
                      key={role.id || role.name}
                      style={styles.roleOption}
                      onPress={() => handleToggleRole(role.name)}
                    >
                      <CheckBox
                        checked={selectedRoleNames.includes(role.name)}
                        onChange={() => handleToggleRole(role.name)}
                      />
                      <Text style={[styles.roleOptionText, { color: theme.colors.text.primary }]}>
                        {role.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <View style={styles.modalActions}>
                  <Pressable
                    style={[
                      styles.modalButton,
                      styles.modalButtonSecondary,
                      {
                        backgroundColor: theme.colors.button.secondary?.background || theme.colors.card.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={handleCloseModal}
                    disabled={savingRoles}
                  >
                    <Text style={[styles.modalButtonText, { color: theme.colors.button.secondary?.text || theme.colors.text.primary }]}>
                      {t("general.cancel")}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor: theme.colors.button.primary.background,
                        opacity: savingRoles ? 0.6 : 1,
                      },
                    ]}
                    onPress={handleSaveRoles}
                    disabled={savingRoles}
                  >
                    {savingRoles ? (
                      <ActivityIndicator size="small" color={theme.colors.button.primary.text} />
                    ) : (
                      <Text style={[styles.modalButtonText, { color: theme.colors.button.primary.text }]}>
                        {t("general.save")}
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
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
  listContent: {
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  userCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing[4],
    borderWidth: 1,
    gap: theme.spacing[3],
  },
  userInfo: {
    flex: 1,
    gap: theme.spacing[1],
  },
  userName: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: theme.fontSize.base,
  },
  rolesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing[1.5],
    marginTop: theme.spacing[2],
  },
  roleBadge: {
    paddingHorizontal: theme.spacing[2],
    paddingVertical: theme.spacing[1],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
  },
  roleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: "500",
  },
  editButton: {
    padding: theme.spacing[2],
  },
  emptyContainer: {
    padding: theme.spacing[8],
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.fontSize.md,
  },
  loadMoreButton: {
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    marginTop: theme.spacing[4],
  },
  loadMoreText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: theme.spacing[6],
    maxHeight: "70%",
    gap: theme.spacing[4],
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "bold",
  },
  modalSubtitle: {
    fontSize: theme.fontSize.base,
    marginTop: -8,
  },
  rolesList: {
    maxHeight: 300,
  },
  rolesListContent: {
    gap: theme.spacing[3],
  },
  roleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  roleOptionText: {
    fontSize: theme.fontSize.md,
    textTransform: "capitalize",
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing[3],
    marginTop: theme.spacing[2],
  },
  modalButton: {
    flex: 1,
    padding: theme.spacing[3.5],
    borderRadius: theme.borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});
