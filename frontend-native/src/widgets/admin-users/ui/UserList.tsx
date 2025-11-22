import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface User {
  id: string | number;
  username?: string;
  email: string;
  roles?: Array<{ id?: string | number; name: string }>;
}

interface UserListProps {
  users: User[];
  total: number;
  page: number;
  pageSize: number;
  onLoadMore: () => void;
  onEditUser: (user: User) => void;
}

export default function UserList({
  users,
  total,
  page,
  pageSize,
  onLoadMore,
  onEditUser,
}: UserListProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const renderUser = ({ item: user }: { item: User }) => (
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
          {user.roles?.map((role) => (
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
        onPress={() => onEditUser(user)}
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
        total > page * pageSize ? (
          <Pressable
            style={[styles.loadMoreButton, { backgroundColor: theme.colors.button.secondary?.background }]}
            onPress={onLoadMore}
          >
            <Text style={[styles.loadMoreText, { color: theme.colors.button.secondary?.text }]}>
              {t("general.load_more") || "Load More"}
            </Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const createStyles = (theme: any) => StyleSheet.create({
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
});

