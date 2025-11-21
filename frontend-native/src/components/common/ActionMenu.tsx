import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useHapticFeedback } from "@/src/hooks/useHapticFeedback";

export interface ActionMenuItem {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
  visible: boolean;
  onClose: () => void;
  anchor?: { x: number; y: number };
}

export default function ActionMenu({
  items,
  visible,
  onClose,
  anchor,
}: ActionMenuProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const haptics = useHapticFeedback();

  const handleItemPress = (item: ActionMenuItem) => {
    if (item.disabled) return;
    haptics.triggerSelection();
    item.onPress();
    onClose();
  };

  if (Platform.OS === "ios" && !anchor) {
    const iosOptions = items.map((item) => item.label);
    iosOptions.push(t("general.cancel") || "Cancel");

    if (visible) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: iosOptions,
          cancelButtonIndex: iosOptions.length - 1,
          destructiveButtonIndex: items.findIndex((item) => item.destructive),
        },
        (buttonIndex) => {
          if (buttonIndex < items.length) {
            handleItemPress(items[buttonIndex]);
          } else {
            onClose();
          }
        }
      );
      setTimeout(() => onClose(), 0);
      return null;
    }
    return null;
  }

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
      >
        <View
          style={[
            styles.menu,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border,
              shadowColor: theme.colors.text.primary,
            },
            anchor && {
              position: "absolute",
              top: anchor.y,
              left: anchor.x,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {items.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.menuItem,
                index < items.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                },
                item.disabled && styles.menuItemDisabled,
              ]}
              onPress={() => handleItemPress(item)}
              disabled={item.disabled}
            >
              {item.icon && (
                <MaterialIcons
                  name={item.icon}
                  size={20}
                  color={
                    item.disabled
                      ? theme.colors.text.tertiary
                      : item.destructive
                      ? theme.colors.status.error.text
                      : theme.colors.text.primary
                  }
                  style={styles.menuIcon}
                />
              )}
              <Text
                style={[
                  styles.menuItemText,
                  {
                    color: item.disabled
                      ? theme.colors.text.tertiary
                      : item.destructive
                      ? theme.colors.status.error.text
                      : theme.colors.text.primary,
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    minWidth: 200,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    flex: 1,
  },
});

