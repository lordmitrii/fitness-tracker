import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { createHeaderOptions } from "@/src/navigation/headerConfig";
import api from "@/src/api";
import { MaterialIcons } from "@expo/vector-icons";
import useConsent from "@/src/hooks/useConsent";
import useStorageObject from "@/src/hooks/useStorageObject";
import { useAuth } from "@/src/context/AuthContext";
import { LoadingState, ErrorState } from "@/src/states";
import { useCooldown } from "@/src/hooks/useCooldown";

const TOPICS = [
  {
    key: "askGeneral",
    endpoint: "/ai/ask-general",
    i18nLabel: "ai_chat.topic_general.label",
    i18nDesc: "ai_chat.topic_general.description",
    welcomeKey: "ai_chat.topic_general.welcome_message",
  },
  {
    key: "askWorkouts",
    endpoint: "/ai/ask-workouts",
    i18nLabel: "ai_chat.topic_workouts.label",
    i18nDesc: "ai_chat.topic_workouts.description",
    welcomeKey: "ai_chat.topic_workouts.welcome_message",
  },
  {
    key: "askStats",
    endpoint: "/ai/ask-stats",
    i18nLabel: "ai_chat.topic_stats.label",
    i18nDesc: "ai_chat.topic_stats.description",
    welcomeKey: "ai_chat.topic_stats.welcome_message",
  },
];

export default function AIChatScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { hasAnyRole } = useAuth();
  const styles = createStyles(theme);

  const [store, setStore] = useStorageObject("aiChatState", {
    selectedTopic: "askGeneral",
    threadIds: {},
    messagesByTopic: {
      askGeneral: [
        { role: "ai", text: t("ai_chat.topic_general.welcome_message") },
      ],
    },
  });

  const { selectedTopic, threadIds, messagesByTopic } = store;
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { consentGiven, giveConsent, ready } = useConsent("aiChatPrivacy");
  const [showConsent, setShowConsent] = useState(false);
  const { cooldown, start: startCooldown } = useCooldown();

  const activeTopicMeta = useMemo(
    () => TOPICS.find((tpc) => tpc.key === selectedTopic) || null,
    [selectedTopic]
  );

  const messages = selectedTopic ? messagesByTopic[selectedTopic as keyof typeof messagesByTopic] || [] : [];

  useEffect(() => {
    if (!ready) {
      setShowConsent(false);
      return;
    }
    if (consentGiven) {
      setShowConsent(false);
      return;
    }
    const id = setTimeout(() => setShowConsent(true), 250);
    return () => clearTimeout(id);
  }, [ready, consentGiven]);

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending || !selectedTopic || !consentGiven) return;

    const userMessage = { role: "user", text: input.trim() };
    const newMessages = [...messages, userMessage];

    setStore((prev) => ({
      ...prev,
      messagesByTopic: {
        ...prev.messagesByTopic,
        [selectedTopic]: newMessages,
      },
    }));

    setInput("");
    setSending(true);
    setError(null);

    try {
      const threadId = threadIds[selectedTopic as keyof typeof threadIds];
      const response = await api.post(activeTopicMeta?.endpoint || "/ai/ask-general", {
        message: input.trim(),
        thread_id: threadId,
      });

      const aiMessage = { role: "ai", text: response.data?.message || response.data?.text || t("ai_chat.error_no_response") };
      const updatedMessages = [...newMessages, aiMessage];

      setStore((prev) => ({
        ...prev,
        threadIds: {
          ...prev.threadIds,
          [selectedTopic]: response.data?.thread_id || threadId,
        },
        messagesByTopic: {
          ...prev.messagesByTopic,
          [selectedTopic]: updatedMessages,
        },
      }));

      startCooldown(2);
    } catch (err) {
      console.error("AI Chat error:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      const errorMessage = { role: "ai", text: t("ai_chat.error_sending") || "Error sending message. Please try again." };
      setStore((prev) => ({
        ...prev,
        messagesByTopic: {
          ...prev.messagesByTopic,
          [selectedTopic]: [...newMessages, errorMessage],
        },
      }));
    } finally {
      setSending(false);
    }
  }, [input, sending, selectedTopic, consentGiven, messages, threadIds, activeTopicMeta, t, setStore, startCooldown]);

  const handleTopicSelect = (topicKey: string) => {
    setStore((prev) => ({
      ...prev,
      selectedTopic: topicKey,
    }));
  };

  if (!hasAnyRole(["admin", "member"])) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.ai_chat") || "AI Chat",
          })}
        />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
            {t("ai_chat.access_denied") || "Access denied. This feature requires member or admin role."}
          </Text>
        </View>
      </>
    );
  }

  const renderMessage = ({ item }: { item: { role: string; text: string } }) => {
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
    <>
      <Stack.Screen
        options={createHeaderOptions(theme, {
          title: t("general.ai_chat") || "AI Chat",
          headerLeft: () => (
            <Pressable
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(tabs)/more");
                }
              }}
              style={{ paddingLeft: 16 }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </Pressable>
          ),
        })}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {showConsent && !consentGiven && (
          <View
            style={[
              styles.consentBanner,
              {
                backgroundColor: theme.colors.button.warning.background,
              },
            ]}
          >
            <Text style={[styles.consentText, { color: theme.colors.button.warning.text }]}>
              {t("ai_chat.consent_required") || "AI Chat requires privacy consent"}
            </Text>
            <Pressable
              style={[
                styles.consentButton,
                {
                  backgroundColor: theme.colors.button.primary.background,
                },
              ]}
              onPress={giveConsent}
            >
              <Text
                style={[
                  styles.consentButtonText,
                  { color: theme.colors.button.primary.text },
                ]}
              >
                {t("general.accept") || "Accept"}
              </Text>
            </Pressable>
          </View>
        )}

        {!selectedTopic ? (
          <ScrollView
            style={styles.topicsContainer}
            contentContainerStyle={styles.topicsContent}
          >
            <Text style={[styles.topicsTitle, { color: theme.colors.text.primary }]}>
              {t("ai_chat.select_topic") || "Select a topic"}
            </Text>
            {TOPICS.map((topic) => (
              <Pressable
                key={topic.key}
                style={[
                  styles.topicCard,
                  {
                    backgroundColor: theme.colors.card.background,
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => handleTopicSelect(topic.key)}
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
        ) : (
          <>
            <View style={styles.topicsSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TOPICS.map((topic) => (
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
                    onPress={() => handleTopicSelect(topic.key)}
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

            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => `${item.role}-${index}`}
              contentContainerStyle={styles.messagesList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                    {t("ai_chat.start_conversation") || "Start a conversation..."}
                  </Text>
                </View>
              }
            />

            {error && (
              <View
                style={[
                  styles.errorBanner,
                  {
                    backgroundColor: theme.colors.status.error.background,
                  },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.status.error.text }]}>
                  {error.message || t("ai_chat.error_sending")}
                </Text>
              </View>
            )}

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
                value={input}
                onChangeText={setInput}
                placeholder={t("ai_chat.type_message") || "Type your message..."}
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                maxLength={1000}
                editable={!sending && consentGiven && cooldown === 0}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      sending || !input.trim() || !consentGiven || cooldown > 0
                        ? theme.colors.button.secondary?.background || theme.colors.border
                        : theme.colors.button.primary.background,
                  },
                ]}
                onPress={handleSend}
                disabled={sending || !input.trim() || !consentGiven || cooldown > 0}
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
                      sending || !input.trim() || !consentGiven || cooldown > 0
                        ? theme.colors.text.tertiary
                        : theme.colors.button.primary.text
                    }
                  />
                )}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  consentBanner: {
    padding: theme.spacing[4],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing[3],
  },
  consentText: {
    flex: 1,
    fontSize: theme.fontSize.base,
  },
  consentButton: {
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.lg,
  },
  consentButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: "600",
  },
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
  errorBanner: {
    padding: theme.spacing[3],
    marginHorizontal: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[2],
  },
  errorText: {
    fontSize: theme.fontSize.base,
  },
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

