import { useState, useRef, useEffect } from "react";
import api from "../api";
import SpinnerIcon from "../icons/SpinnerIcon";
import { useTranslation } from "react-i18next";
import { cloneElement } from "react";
import CloseIcon from "../icons/CloseIcon";
import useScrollLock from "../hooks/useScrollLock";
import ReactMarkdown from "react-markdown";
import useConsent from "../hooks/useConsent";
import ConsentModal from "../components/ConsentModal";

const AIChat = ({ open: openProp, onOpenChange, trigger, endpoint }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chatWindowRef = useRef(null);
  const { t } = useTranslation();

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: t("ai_chat.welcome_message_stats"),
    },
  ]);

  const isControlled = openProp !== undefined && onOpenChange;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;
  const close = () => setOpen(false);

  const { consentGiven, giveConsent } = useConsent("aiChatConsent");
  const [showConsent, setShowConsent] = useState(false);

  const handleTriggerClick = () => {
    if (!consentGiven) setShowConsent(true);
    else setOpen(true);
  };

  // Disable body scroll when chat is open
  useScrollLock(open);

  if (!endpoint) return null;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, open]);

  //   useEffect(() => {
  //     function handleClick(e) {
  //       if (
  //         open &&
  //         chatWindowRef.current &&
  //         !chatWindowRef.current.parentNode.contains(e.target)
  //       ) {
  //         close();
  //       }
  //     }
  //     document.addEventListener("pointerdown", handleClick);
  //     return () => document.removeEventListener("pointerdown", handleClick);
  //   }, [open]);

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
      setError(err.message || t("ai_chat.error"));
    } finally {
      setInput("");
      setLoading(false);
    }
  };

  return (
    <>
      {trigger ? cloneElement(trigger, { onClick: handleTriggerClick }) : null}
      <ConsentModal
        open={showConsent}
        onAccept={() => {
          giveConsent();
          setShowConsent(false);
          setOpen(true);
        }}
        onDecline={() => {
          setShowConsent(false);
          setOpen(false);
        }}
      />
      {open && (
        <div className="fixed inset-0 w-full h-full pt-[calc(4rem+env(safe-area-inset-top))] bg-white rounded-2xl shadow-lg flex flex-col z-10">
          <button
            className="text-gray-600 hover:text-blue-500 transition p-2 bg-blue-200/40 rounded-b-md flex items-center justify-center"
            onClick={close}
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              {t("ai_chat.close_chat")}
              <CloseIcon />
            </span>
          </button>
          <div className="flex-1 overflow-y-auto p-6" ref={chatWindowRef}>
            <div className="flex flex-col gap-4">
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
          </div>
          <form
            onSubmit={handleSend}
            className="flex flex-col items-start bg-white gap-2 border-t border-gray-200 p-4"
          >
            {error && <div className="text-caption-red mt-1">{error}</div>}
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
                className="btn btn-primary px-4 py-2"
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <SpinnerIcon className="animate-spin w-4 h-4" />
                ) : (
                  t("ai_chat.send_button")
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default AIChat;
