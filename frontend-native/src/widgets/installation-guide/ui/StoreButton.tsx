import { Pressable, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface StoreButtonProps {
  onPress: () => void;
  label: string;
}

export function StoreButton({ onPress, label }: StoreButtonProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Pressable
      style={[styles.storeButton, { backgroundColor: theme.colors.button.primary.background }]}
      onPress={onPress}
    >
      <MaterialIcons name="store" size={20} color={theme.colors.button.primary.text} />
      <Text style={[styles.storeButtonText, { color: theme.colors.button.primary.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  storeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing[2],
    padding: theme.spacing[3.5],
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing[2],
  },
  storeButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: "600",
  },
});

