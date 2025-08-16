import { createContext, useContext, useEffect } from "react";

export const HeaderContext = createContext(null);

export const useHeader = () => {
  const ctx = useContext(HeaderContext);
  if (!ctx)
    throw new Error("useHeader must be used within a HeaderContext.Provider");
  return ctx;
};

export const LayoutHeader = ({ children }) => {
  const { setHeader } = useHeader();
  useEffect(() => {
    setHeader(children);
    return () => setHeader(null);
  }, [children, setHeader]);
  return null;
};
