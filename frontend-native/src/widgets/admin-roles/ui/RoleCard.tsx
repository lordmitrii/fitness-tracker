import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface Role {
  id: number;
  name: string;
}

interface RoleCardProps {
  role: Role;
}

export default function RoleCard({ role }: RoleCardProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
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
}

const createStyles = (theme: any) => StyleSheet.create({
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
});

