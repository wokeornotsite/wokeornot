"use client";

import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import EmotionCacheProvider from "./EmotionCacheProvider";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: { default: "#101014", paper: "#191927" },
    text: { primary: "#fff" },
    primary: { main: "#fbbf24" },
    secondary: { main: "#37376b" },
    error: { main: "#ef4444" },
  },
});

export default function MUIProvider({ children }: { children: React.ReactNode }) {
  return (
    <EmotionCacheProvider>
      <ThemeProvider theme={darkTheme}>{children}</ThemeProvider>
    </EmotionCacheProvider>
  );
}
