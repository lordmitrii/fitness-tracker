import { useRef } from "react";
import { ScrollView } from "react-native";

export default function useScrollToTop() {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToTop = () => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  return { scrollViewRef, scrollToTop };
}
