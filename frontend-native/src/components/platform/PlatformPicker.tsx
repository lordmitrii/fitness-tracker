import React from "react";
import { Platform, View, Text, Pressable, Modal, StyleSheet, FlatList } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useHapticFeedback } from "@/src/shared/hooks/interaction";

export interface PickerOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

interface PlatformPickerProps<T = string> {
  options: PickerOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function PlatformPicker<T = string>({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  label,
  disabled = false,
}: PlatformPickerProps<T>) {
  const { theme } = useTheme();
  const haptics = useHapticFeedback();
  const [visible, setVisible] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (optionValue: T) => {
    haptics.triggerSelection();
    onValueChange(optionValue);
    setVisible(false);
  };

  return (
    <View>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text.primary }]}>
          {label}
        </Text>
      )}
      <Pressable
        style={[
          styles.picker,
          {
            backgroundColor: theme.colors.input?.background || theme.colors.card.background,
            borderColor: theme.colors.border,
          },
          disabled && styles.pickerDisabled,
        ]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.pickerText,
            {
              color: selectedOption
                ? theme.colors.text.primary
                : theme.colors.text.tertiary,
            },
          ]}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <MaterialIcons
          name="arrow-drop-down"
          size={24}
          color={theme.colors.text.secondary}
        />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType={Platform.OS === "ios" ? "slide" : "fade"}
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setVisible(false)}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.card.background,
                borderColor: theme.colors.border,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            {Platform.OS === "ios" && (
              <View style={styles.modalHandle}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: theme.colors.text.tertiary },
                  ]}
                />
              </View>
            )}
            <FlatList
              data={options}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              renderItem={({ item }) => (
                <Pressable
                  style={[
                    styles.option,
                    {
                      backgroundColor:
                        item.value === value
                          ? theme.colors.button.primary.background
                          : "transparent",
                    },
                    item.disabled && styles.optionDisabled,
                  ]}
                  onPress={() => !item.disabled && handleSelect(item.value)}
                  disabled={item.disabled}
                >
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          item.value === value
                            ? theme.colors.button.primary.text
                            : theme.colors.text.primary,
                        fontWeight: item.value === value ? "600" : "400",
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {item.value === value && (
                    <MaterialIcons
                      name="check"
                      size={20}
                      color={theme.colors.button.primary.text}
                    />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  picker: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 44,
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
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
    maxHeight: "50%",
    paddingBottom: Platform.OS === "ios" ? 32 : 16,
  },
  modalHandle: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
});

