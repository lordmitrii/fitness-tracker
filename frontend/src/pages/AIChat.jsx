import { useState, useRef, useEffect, useMemo } from "react";
import api from "../api";
import SpinnerIcon from "../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import useConsent from "../hooks/useConsent";
import ConsentModal from "../components/ConsentModal";
import { useNavigate } from "react-router-dom";
import { useCooldown } from "../hooks/useCooldown";
import useStorageState from "../hooks/useStorageObject";
import { useAuth } from "../context/AuthContext";
import ErrorState from "../states/ErrorState";
import LoadingState from "../states/LoadingState";

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

const AIChat = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();

  const [store, setStore, { restoring }] = useStorageState("aiChatState", {
    selectedTopic: "askGeneral", // Set to null if want to show "choose topic" first. Now general topic will be preselected.
    threadIds: {},
    messagesByTopic: {},
  });

  const { selectedTopic, threadIds, messagesByTopic } = store;

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const chatWindowRef = useRef(null);

  const { consentGiven, giveConsent } = useConsent("ai_chat");
  const { cooldown, start: startCooldown } = useCooldown();

  const activeTopicMeta = useMemo(
    () => TOPICS.find((tpc) => tpc.key === selectedTopic) || null,
    [selectedTopic]
  );

  const messages = selectedTopic ? messagesByTopic[selectedTopic] || [] : [];

  useEffect(() => {
    if (restoring || !selectedTopic) return;

    const welcome = {
      role: "ai",
      text: t(activeTopicMeta?.welcomeKey || "ai_chat.welcome_message_generic"),
    };
    setStore((prev) => {
      if (prev.messagesByTopic[selectedTopic]?.length) return prev;
      return {
        ...prev,
        messagesByTopic: {
          ...prev.messagesByTopic,
          [selectedTopic]: [welcome],
        },
      };
    });
    setError(null);
    setInput("");
  }, [selectedTopic, t, activeTopicMeta]);

  useEffect(() => {
    if (cooldown > 0)
      setError(t("ai_chat.rate_limit_exceeded", { time: cooldown }));
    else setError(null);
  }, [cooldown, t]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const appendMessage = (topicKey, msg) => {
    setStore((prev) => ({
      ...prev,
      messagesByTopic: {
        ...prev.messagesByTopic,
        [topicKey]: [...(prev.messagesByTopic[topicKey] || []), msg],
      },
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    if (!selectedTopic) {
      setError(t("ai_chat.error_select_topic_first"));
      return;
    }

    appendMessage(selectedTopic, { role: "user", text: input });
    setSending(true);
    setError(null);

    try {
      if (!activeTopicMeta?.endpoint)
        throw new Error("No endpoint for selected topic.");

      const previousResponseId = threadIds[selectedTopic] || null;
      const { data } = await api.post(
        activeTopicMeta.endpoint,
        {
          question: input,
          previous_response_id: previousResponseId,
        },
        {
          timeout: 60000, // 60 seconds timeout
        }
      );

      const answerText = data?.answer || t("ai_chat.error");
      const responseId = data?.response_id || null;

      if (responseId) {
        setStore((prev) => ({
          ...prev,
          threadIds: {
            ...prev.threadIds,
            [selectedTopic]: responseId,
          },
        }));
      }

      appendMessage(selectedTopic, {
        role: "ai",
        text: answerText,
        responseId,
      });
    } catch (err) {
      appendMessage(selectedTopic, {
        role: "ai",
        text: t("ai_chat.error_response"),
      });
      if (err?.response?.status === 429) {
        const retryAfter =
          parseInt(err.response.headers?.["retry-after"], 10) || 60;
        startCooldown(retryAfter);
      } else if (err?.response?.status === 403) {
        setError(t("ai_chat.error_insufficient_permissions"));
      } else {
        console.error("AI Chat error:", err);
        setError(err.message || t("ai_chat.error"));
      }
    } finally {
      setInput("");
      setSending(false);
    }
  };

  if (restoring) return <LoadingState />;
  if (!hasAnyRole(["admin", "member"]))
    return (
      <ErrorState
        message={t("general.page_no_permissions")}
        onRetry={() => navigate("/")}
      />
    );

  return (
    <>
      <ConsentModal
        open={!consentGiven}
        onAccept={giveConsent}
        onDecline={() => navigate("/")}
      />

      <div className="flex flex-col h-[calc(100vh-env(safe-area-inset-top)-var(--custom-header-size))]">
        <div className="border-b border-gray-200 bg-white p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-body font-semibold">
              {t("ai_chat.choose_topic")}
            </div>
            <div className="flex gap-2 flex-wrap">
              {TOPICS.map((topic) => (
                <button
                  key={topic.key}
                  type="button"
                  onClick={() =>
                    setStore((s) => ({ ...s, selectedTopic: topic.key }))
                  }
                  className={`px-2 py-1 rounded-xl ${
                    store.selectedTopic === topic.key
                      ? "btn-primary"
                      : "btn-secondary"
                  }`}
                >
                  {t(topic.i18nLabel)}
                </button>
              ))}
            </div>
          </div>
          {activeTopicMeta ? (
            <p className="text-caption mt-2">{t(activeTopicMeta.i18nDesc)}</p>
          ) : (
            <p className="text-caption mt-2">
              {t("ai_chat.select_topic_helper")}
            </p>
          )}
        </div>

        {/* Chat window */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-4"
          ref={chatWindowRef}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-xl max-w-[80%] overflow-x-auto shadow select-auto ${
                  msg.role === "user"
                    ? "bg-blue-100 text-blue-900"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="px-4 py-2 text-gray-500 rounded-xl bg-gray-100 shadow flex items-center gap-2">
                <SpinnerIcon className="animate-spin w-4 h-4" />
                {t("ai_chat.thinking")}
              </div>
            </div>
          )}
        </div>
        <form
          onSubmit={handleSend}
          className="bg-white gap-2 border-t border-gray-200 p-8 sm:p-6"
        >
          {(error || cooldown > 0) && (
            <div className="text-caption-red mb-1">
              {error || t("ai_chat.wait_seconds", { seconds: cooldown })}
            </div>
          )}
          <div className="flex w-full gap-2">
            <input
              className="input-style"
              placeholder={
                selectedTopic
                  ? t("ai_chat.user_input_placeholder")
                  : t("ai_chat.user_input_placeholder_select_topic")
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending || !selectedTopic}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) handleSend(e);
              }}
            />
            <button
              type="submit"
              className={`btn ${
                cooldown > 0 || !selectedTopic ? "btn-secondary" : "btn-primary"
              }`}
              disabled={
                sending || !input.trim() || cooldown > 0 || !selectedTopic
              }
            >
              <span className="whitespace-nowrap">
                {sending ? (
                  <SpinnerIcon className="animate-spin w-4 h-4" />
                ) : (
                  t("ai_chat.send_button")
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default AIChat;
