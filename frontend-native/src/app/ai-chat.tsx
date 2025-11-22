import { useState, useRef, useEffect } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { Stack, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/shared/lib/context/ThemeContext";
import { createHeaderOptions } from "@/src/shared/lib/navigation/headerConfig";
import { useAuth } from "@/src/shared/lib/context/AuthContext";
import { useConsent } from "@/src/shared/hooks";
import { MaterialIcons } from "@expo/vector-icons";
import { FlatList } from "react-native";

import {
  ChatMessagesList,
  ChatInput,
  TopicSelector,
  TopicCards,
  ConsentBanner,
  ErrorBanner,
} from "@/src/widgets/ai-chat";
import {
  useChatState,
  useSendMessage,
  useTopicSelection,
  TOPICS,
} from "@/src/features/ai-chat";

export default function AIChatScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { hasAnyRole } = useAuth();

  const {
    selectedTopic,
    messages,
    activeTopicMeta,
    updateSelectedTopic,
    updateMessages,
    updateThreadId,
    threadIds,
  } = useChatState();

  const { consentGiven, giveConsent, ready } = useConsent("aiChatPrivacy");
  const [showConsent, setShowConsent] = useState(false);
  const [input, setInput] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { sendMessage, sending, error, cooldown } = useSendMessage({
    selectedTopic,
    activeTopicMeta,
    threadIds,
    messages,
    updateMessages,
    updateThreadId,
    consentGiven,
  });

  const { handleTopicSelect } = useTopicSelection({
    updateSelectedTopic,
  });

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

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  if (!hasAnyRole(["admin", "member"])) {
    return (
      <>
        <Stack.Screen
          options={createHeaderOptions(theme, {
            title: t("general.ai_chat") || "AI Chat",
          })}
        />
        <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: "center", alignItems: "center", padding: theme.spacing[4] }}>
          <Text style={{ color: theme.colors.status.error.text }}>
            {t("ai_chat.access_denied") || "Access denied. This feature requires member or admin role."}
          </Text>
        </View>
      </>
    );
  }

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
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {showConsent && !consentGiven && (
          <ConsentBanner onAccept={giveConsent} />
        )}

        {!selectedTopic ? (
          <TopicCards topics={TOPICS} onSelectTopic={handleTopicSelect} />
        ) : (
          <>
            <TopicSelector
              topics={TOPICS}
              selectedTopic={selectedTopic}
              onSelectTopic={handleTopicSelect}
            />

            <ChatMessagesList
              messages={messages}
              flatListRef={flatListRef as React.RefObject<FlatList<any>>}
              emptyText={t("ai_chat.start_conversation") || "Start a conversation..."}
            />

            <ErrorBanner error={error} />

            <ChatInput
              value={input}
              onChangeText={setInput}
              onSend={handleSend}
              sending={sending}
              disabled={!consentGiven || cooldown > 0}
            />
          </>
        )}
      </KeyboardAvoidingView>
    </>
  );
}
