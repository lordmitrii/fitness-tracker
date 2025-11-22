import { View, ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Topic } from "@/src/features/ai-chat/lib/Types";

interface TopicSelectorProps {
  topics: Topic[];
  selectedTopic: string | null;
  onSelectTopic: (topicKey: string) => void;
}

export default function TopicSelector({
  topics,
  selectedTopic,
  onSelectTopic,
}: TopicSelectorProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const styles = createStyles(theme);

  return (
    <View style={styles.topicsSelector}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {topics.map((topic) => (
          <Pressable
            key={topic.key}
            style={[
              styles.topicChip,
              selectedTopic === topic.key && styles.topicChipActive,
              {
                backgroundColor:
                  selectedTopic === topic.key
                    ? theme.colors.button.primary.background
                    : theme.colors.card.background,
                borderColor:
                  selectedTopic === topic.key
                    ? theme.colors.button.primary.background
                    : theme.colors.border,
              },
            ]}
            onPress={() => onSelectTopic(topic.key)}
          >
            <Text
              style={[
                styles.topicChipText,
                {
                  color:
                    selectedTopic === topic.key
                      ? theme.colors.button.primary.text
                      : theme.colors.text.primary,
                },
              ]}
            >
              {t(topic.i18nLabel)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  topicsSelector: {
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  topicChip: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    marginRight: theme.spacing[2],
  },
  topicChipActive: {},
  topicChipText: {
    fontSize: theme.fontSize.base,
    fontWeight: "500",
  },
});

