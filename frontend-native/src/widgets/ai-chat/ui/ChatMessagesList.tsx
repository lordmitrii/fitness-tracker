import { FlatList, View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";

interface Message {
  role: string;
  text: string;
}

interface ChatMessagesListProps {
  messages: Message[];
  flatListRef?: React.RefObject<FlatList<Message>>;
  emptyText?: string;
}

export default function ChatMessagesList({
  messages,
  flatListRef,
  emptyText,
}: ChatMessagesListProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isUser
                ? theme.colors.button.primary.background
                : theme.colors.card.background,
              borderColor: isUser ? theme.colors.button.primary.background : theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isUser
                  ? theme.colors.button.primary.text
                  : theme.colors.text.primary,
              },
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item, index) => `${item.role}-${index}`}
      contentContainerStyle={styles.messagesList}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
            {emptyText || "Start a conversation..."}
          </Text>
        </View>
      }
    />
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  messagesList: {
    padding: theme.spacing[4],
    gap: theme.spacing[3],
  },
  messageContainer: {
    marginBottom: theme.spacing[2],
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  aiMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius['2xl'],
    borderWidth: 1,
  },
  messageText: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
  emptyContainer: {
    padding: theme.spacing[8],
    alignItems: "center",
  },
  emptyText: {
    fontSize: theme.fontSize.md,
  },
});

