import { useWindowDimensions } from "react-native";

interface Options {
  breakpoint?: number;
}

export function useIsBelowSm({ breakpoint = 640 }: Options = {}) {
  const { width } = useWindowDimensions();
  return width <= breakpoint;
}

export default useIsBelowSm;
