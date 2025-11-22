import React, { memo } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface CheckBoxProps {
  id?: string;
  title?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  customIcon?: React.ReactNode;
  disabled?: boolean;
}

const CheckBox = ({
  id,
  title,
  checked,
  onChange,
  customIcon,
  disabled = false,
}: CheckBoxProps) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        { opacity: disabled ? 0.5 : pressed ? 0.7 : 1 },
      ]}
      accessibilityLabel={title}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked
              ? theme.colors.button.primary.background
              : theme.colors.card.background,
            borderColor: checked
              ? theme.colors.button.primary.background
              : theme.colors.border,
          },
        ]}
      >
        {checked && (
          <View style={styles.iconContainer}>
            {customIcon || (
              <MaterialIcons
                name="check"
                size={18}
                color={theme.colors.button.primary.text}
              />
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default memo(CheckBox);

