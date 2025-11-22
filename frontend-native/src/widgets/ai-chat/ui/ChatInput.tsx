import { View, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  sending?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  sending = false,
  disabled = false,
  placeholder,
}: ChatInputProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  const isDisabled = sending || !value.trim() || disabled;

  return (
    <View
      style={[
        styles.inputContainer,
        {
          backgroundColor: theme.colors.card.background,
          borderTopColor: theme.colors.border,
        },
      ]}
    >
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.input?.background || theme.colors.background,
            borderColor: theme.colors.border,
            color: theme.colors.text.primary,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || t("ai_chat.type_message") || "Type your message..."}
        placeholderTextColor={theme.colors.text.tertiary}
        multiline
        maxLength={1000}
        editable={!isDisabled}
      />
      <Pressable
        style={[
          styles.sendButton,
          {
            backgroundColor: isDisabled
              ? theme.colors.button.secondary?.background || theme.colors.border
              : theme.colors.button.primary.background,
          },
        ]}
        onPress={onSend}
        disabled={isDisabled}
      >
        {sending ? (
          <ActivityIndicator
            size="small"
            color={theme.colors.button.primary.text}
          />
        ) : (
          <MaterialIcons
            name="send"
            size={20}
            color={
              isDisabled
                ? theme.colors.text.tertiary
                : theme.colors.button.primary.text
            }
          />
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: theme.spacing[3],
    borderTopWidth: 1,
    gap: theme.spacing[2],
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2.5],
    maxHeight: 100,
    fontSize: theme.fontSize.md,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});

