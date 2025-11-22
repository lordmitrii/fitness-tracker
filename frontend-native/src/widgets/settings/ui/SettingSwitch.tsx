import { Switch, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface SettingSwitchProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function SettingSwitch({
  checked,
  onChange,
  disabled = false,
}: SettingSwitchProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Switch
      value={checked}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{
        false: theme.colors.border,
        true: theme.colors.button.primary.background,
      }}
      thumbColor={theme.colors.card.background}
      style={styles.switch}
    />
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  switch: {
    marginTop: theme.spacing[2],
    alignSelf: "flex-start",
  },
});

