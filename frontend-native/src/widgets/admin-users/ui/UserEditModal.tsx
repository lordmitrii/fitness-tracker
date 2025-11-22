import { View, Text, Modal, ScrollView, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { CheckBox } from "@/src/shared/ui/CheckBox";

interface Role {
  id?: string | number;
  name: string;
}

interface User {
  id: string | number;
  username?: string;
  email: string;
}

interface UserEditModalProps {
  visible: boolean;
  user: User | null;
  allRoles: Role[];
  selectedRoleNames: string[];
  saving: boolean;
  onClose: () => void;
  onToggleRole: (roleName: string) => void;
  onSave: () => void;
}

export default function UserEditModal({
  visible,
  user,
  allRoles,
  selectedRoleNames,
  saving,
  onClose,
  onToggleRole,
  onSave,
}: UserEditModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  if (!user) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
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
            <Pressable onPress={onClose}>
              <MaterialIcons
                name="close"
                size={24}
                color={theme.colors.text.primary}
              />
            </Pressable>
          </View>
          <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
            {user.username || user.email}
          </Text>
          <ScrollView style={styles.rolesList} contentContainerStyle={styles.rolesListContent}>
            {allRoles.map((role) => (
              <Pressable
                key={role.id || role.name}
                style={styles.roleOption}
                onPress={() => onToggleRole(role.name)}
              >
                <CheckBox
                  checked={selectedRoleNames.includes(role.name)}
                  onChange={() => onToggleRole(role.name)}
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
              onPress={onClose}
              disabled={saving}
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
                  opacity: saving ? 0.6 : 1,
                },
              ]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
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
  );
}

const createStyles = (theme: any) => StyleSheet.create({
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

