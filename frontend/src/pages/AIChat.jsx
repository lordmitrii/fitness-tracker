import { useState, useRef, useEffect } from "react";
import api from "../api";
import SpinnerIcon from "../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import useConsent from "../hooks/useConsent";
import ConsentModal from "../components/ConsentModal";
import { useNavigate } from "react-router-dom";
import { useCooldown } from "../hooks/useCooldown";

const endpoint = "/ai/ask-workout-plan";

const AIChat = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatWindowRef = useRef(null);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: t("ai_chat.welcome_message_stats"),
    },
  ]);

  const { consentGiven, giveConsent } = useConsent("aiChatConsent");

  const { cooldown, start: startCooldown } = useCooldown();

  useEffect(() => {
    if (cooldown > 0) {
      setError(t("ai_chat.rate_limit_exceeded", { time: cooldown }));
    } else {
      setError(null);
    }
  }, [cooldown]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setMessages((msgs) => [...msgs, { role: "user", text: input }]);
    setLoading(true);
    setError(null);

    try {
      const previousResponseId =
        messages[messages.length - 1]?.responseId || null;

      const { data } = await api.post(endpoint, {
        question: input,
        previous_response_id: previousResponseId,
      });
      setMessages((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: data.answer || t("ai_chat.error"),
          responseId: data.response_id || null,
        },
      ]);
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        {
          role: "ai",
          text: t("ai_chat.error_response"),
        },
      ]);
      if (err.response?.status === 429) {
        const retryAfter =
          parseInt(err.response.headers?.["retry-after"], 10) || 60;
        startCooldown(retryAfter);
      } else {
        setError(err.message || t("ai_chat.error"));
      }
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <>
      <ConsentModal
        open={!consentGiven}
        onAccept={() => {
          giveConsent();
        }}
        onDecline={() => {
          navigate("/");
        }}
      />
      {/* TODO: Consider making a dynamic height instead of using fixed values */}
      <div className="flex flex-col h-[calc(100vh-env(safe-area-inset-top)-var(--custom-header-size))]">
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
                className={`px-4 py-2 rounded-xl max-w-[80%] overflow-x-auto shadow select-auto
                        ${
                          msg.role === "user"
                            ? "bg-blue-100 text-blue-900"
                            : "bg-gray-100 text-gray-700"
                        }
                      `}
              >
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2 rounded-xl bg-gray-100 text-gray-500 shadow flex items-center gap-2">
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
              {error ? error : "wait " + cooldown}
            </div>
          )}
          <div className="flex w-full gap-2">
            <input
              className="input-style"
              placeholder={t("ai_chat.user_input_placeholder")}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) handleSend(e);
              }}
            />
            <button
              type="submit"
              className={`btn ${
                cooldown > 0 ? "btn-secondary" : "btn-primary"
              }`}
              disabled={loading || !input.trim() || cooldown > 0}
            >
              <span className="whitespace-nowrap">
                {loading ? (
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
