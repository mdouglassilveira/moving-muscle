"use client";

import { createContext, useContext, type ReactNode } from "react";

const MapsKeyContext = createContext<string>("");

export function useMapsKey() {
  return useContext(MapsKeyContext);
}

export function MapsConfigProvider({
  apiKey,
  children
}: {
  apiKey: string;
  children: ReactNode;
}) {
  return (
    <MapsKeyContext.Provider value={apiKey}>{children}</MapsKeyContext.Provider>
  );
}
