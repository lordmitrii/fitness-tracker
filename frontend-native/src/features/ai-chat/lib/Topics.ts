import { Topic } from "./Types";

export const TOPICS: Topic[] = [
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

