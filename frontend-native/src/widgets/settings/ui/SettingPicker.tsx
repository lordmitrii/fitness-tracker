import { View, Text, Modal, Pressable, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface Option {
  value: string;
  label: string;
}

interface SettingPickerProps {
  title: string;
  value: string;
  options: Option[];
  visible: boolean;
  disabled?: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (value: string) => void;
}

export default function SettingPicker({
  title,
  value,
  options,
  visible,
  disabled = false,
  onOpen,
  onClose,
  onSelect,
}: SettingPickerProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <>
      <Pressable
        style={[
          styles.selectButton,
          {
            backgroundColor: theme.colors.input?.background || theme.colors.card.background,
            borderColor: theme.colors.border,
          },
        ]}
        onPress={onOpen}
        disabled={disabled}
      >
        <Text style={[styles.selectButtonText, { color: theme.colors.text.primary }]}>
          {selectedOption.label}
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
        animationType="slide"
        onRequestClose={onClose}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={onClose}
        >
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.colors.card.background,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
              {title}
            </Text>
            {options.map((opt) => (
              <Pressable
                key={opt.value}
                style={[
                  styles.modalOption,
                  {
                    backgroundColor:
                      value === opt.value
                        ? theme.colors.button.primary.background
                        : "transparent",
                  },
                ]}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    {
                      color:
                        value === opt.value
                          ? theme.colors.button.primary.text
                          : theme.colors.text.primary,
                      fontWeight:
                        value === opt.value
                          ? "600"
                          : "400",
                    },
                  ]}
                >
                  {opt.label}
                </Text>
                {value === opt.value && (
                  <MaterialIcons
                    name="check"
                    size={20}
                    color={theme.colors.button.primary.text}
                  />
                )}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing[3],
    marginTop: theme.spacing[2],
    minHeight: 44,
  },
  selectButtonText: {
    fontSize: theme.fontSize.md,
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
    padding: theme.spacing[5],
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "bold",
    marginBottom: theme.spacing[4],
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[2],
  },
  modalOptionText: {
    fontSize: theme.fontSize.md,
  },
});

