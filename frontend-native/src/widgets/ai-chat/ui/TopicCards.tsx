import { ScrollView, View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Topic } from "@/src/features/ai-chat/lib/Types";

interface TopicCardsProps {
  topics: Topic[];
  onSelectTopic: (topicKey: string) => void;
  title?: string;
}

export default function TopicCards({
  topics,
  onSelectTopic,
  title,
}: TopicCardsProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <ScrollView
      style={styles.topicsContainer}
      contentContainerStyle={styles.topicsContent}
    >
      <Text style={[styles.topicsTitle, { color: theme.colors.text.primary }]}>
        {title || t("ai_chat.select_topic") || "Select a topic"}
      </Text>
      {topics.map((topic) => (
        <Pressable
          key={topic.key}
          style={[
            styles.topicCard,
            {
              backgroundColor: theme.colors.card.background,
              borderColor: theme.colors.border,
            },
          ]}
          onPress={() => onSelectTopic(topic.key)}
        >
          <Text style={[styles.topicTitle, { color: theme.colors.text.primary }]}>
            {t(topic.i18nLabel)}
          </Text>
          <Text style={[styles.topicDesc, { color: theme.colors.text.secondary }]}>
            {t(topic.i18nDesc)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  topicsContainer: {
    flex: 1,
  },
  topicsContent: {
    padding: theme.spacing[4],
    gap: theme.spacing[4],
  },
  topicsTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: "bold",
    marginBottom: theme.spacing[2],
  },
  topicCard: {
    padding: theme.spacing[5],
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    gap: theme.spacing[2],
  },
  topicTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: "600",
  },
  topicDesc: {
    fontSize: theme.fontSize.base,
    lineHeight: theme.lineHeight.normal,
  },
});

