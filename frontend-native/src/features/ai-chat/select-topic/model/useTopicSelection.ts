import { useCallback } from "react";

interface UseTopicSelectionParams {
  updateSelectedTopic: (topicKey: string) => void;
}

export function useTopicSelection({ updateSelectedTopic }: UseTopicSelectionParams) {
  const handleTopicSelect = useCallback(
    (topicKey: string) => {
      updateSelectedTopic(topicKey);
    },
    [updateSelectedTopic]
  );

  return {
    handleTopicSelect,
  };
}

