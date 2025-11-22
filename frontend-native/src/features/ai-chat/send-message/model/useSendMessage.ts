import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import api from "@/src/shared/api";
import { useCooldown } from "@/src/shared/hooks/interaction";

interface UseSendMessageParams {
  selectedTopic: string | null;
  activeTopicMeta: { endpoint: string } | null;
  threadIds: Record<string, string>;
  messages: Array<{ role: string; text: string }>;
  updateMessages: (topicKey: string, newMessages: Array<{ role: string; text: string }>) => void;
  updateThreadId: (topicKey: string, threadId: string) => void;
  consentGiven: boolean;
}

export function useSendMessage({
  selectedTopic,
  activeTopicMeta,
  threadIds,
  messages,
  updateMessages,
  updateThreadId,
  consentGiven,
}: UseSendMessageParams) {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { cooldown, start: startCooldown } = useCooldown();

  const sendMessage = useCallback(
    async (input: string) => {
      if (!input.trim() || sending || !selectedTopic || !consentGiven) return;

      const userMessage = { role: "user", text: input.trim() };
      const newMessages = [...messages, userMessage];

      updateMessages(selectedTopic, newMessages);

      setSending(true);
      setError(null);

      try {
        const threadId = threadIds[selectedTopic as keyof typeof threadIds];
        const response = await api.post(activeTopicMeta?.endpoint || "/ai/ask-general", {
          message: input.trim(),
          thread_id: threadId,
        });

        const aiMessage = {
          role: "ai",
          text: response.data?.message || response.data?.text || t("ai_chat.error_no_response"),
        };
        const updatedMessages = [...newMessages, aiMessage];

        updateMessages(selectedTopic, updatedMessages);

        if (response.data?.thread_id) {
          updateThreadId(selectedTopic, response.data.thread_id);
        }

        startCooldown(2);
      } catch (err) {
        console.error("AI Chat error:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
        const errorMessage = {
          role: "ai",
          text: t("ai_chat.error_sending") || "Error sending message. Please try again.",
        };
        updateMessages(selectedTopic, [...newMessages, errorMessage]);
      } finally {
        setSending(false);
      }
    },
    [
      sending,
      selectedTopic,
      consentGiven,
      messages,
      threadIds,
      activeTopicMeta,
      t,
      updateMessages,
      updateThreadId,
      startCooldown,
    ]
  );

  return {
    sendMessage,
    sending,
    error,
    cooldown,
  };
}

