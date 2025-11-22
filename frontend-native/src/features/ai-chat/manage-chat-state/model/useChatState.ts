import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStorageObject } from "@/src/shared/hooks";
import { TOPICS } from "../../lib/Topics";

interface ChatState {
  selectedTopic: string;
  threadIds: Record<string, string>;
  messagesByTopic: Record<string, Array<{ role: string; text: string }>>;
}

const DEFAULT_STATE: ChatState = {
  selectedTopic: "askGeneral",
  threadIds: {},
  messagesByTopic: {},
};

export function useChatState() {
  const { t } = useTranslation();
  
  const getDefaultState = (): ChatState => ({
    ...DEFAULT_STATE,
    messagesByTopic: {
      askGeneral: [
        { role: "ai", text: t("ai_chat.topic_general.welcome_message") },
      ],
    },
  });

  const [store, setStore] = useStorageObject<ChatState>("aiChatState", getDefaultState());

  const { selectedTopic, threadIds, messagesByTopic } = store;

  const activeTopicMeta = useMemo(
    () => TOPICS.find((tpc) => tpc.key === selectedTopic) || null,
    [selectedTopic]
  );

  const messages = selectedTopic
    ? messagesByTopic[selectedTopic as keyof typeof messagesByTopic] || []
    : [];

  const updateSelectedTopic = (topicKey: string) => {
    setStore((prev) => ({
      ...prev,
      selectedTopic: topicKey,
    }));
  };

  const updateMessages = (topicKey: string, newMessages: Array<{ role: string; text: string }>) => {
    setStore((prev) => ({
      ...prev,
      messagesByTopic: {
        ...prev.messagesByTopic,
        [topicKey]: newMessages,
      },
    }));
  };

  const updateThreadId = (topicKey: string, threadId: string) => {
    setStore((prev) => ({
      ...prev,
      threadIds: {
        ...prev.threadIds,
        [topicKey]: threadId,
      },
    }));
  };

  return {
    selectedTopic,
    threadIds,
    messagesByTopic,
    messages,
    activeTopicMeta,
    updateSelectedTopic,
    updateMessages,
    updateThreadId,
    setStore,
  };
}

