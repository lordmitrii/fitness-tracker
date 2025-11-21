import { Platform, Switch, SwitchProps } from "react-native";
import { useTheme } from "@/src/context/ThemeContext";

interface PlatformSwitchProps extends Omit<SwitchProps, "trackColor" | "thumbColor"> {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function PlatformSwitch({
  value,
  onValueChange,
  ...props
}: PlatformSwitchProps) {
  const { theme } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: theme.colors.border,
        true: theme.colors.button.primary.background,
      }}
      thumbColor={
        Platform.OS === "ios"
          ? theme.colors.card.background
          : theme.colors.card.background
      }
      ios_backgroundColor={theme.colors.border}
      {...props}
    />
  );
}


