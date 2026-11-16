import { createTheme, type Theme } from "@mui/material/styles";

export function createAppTheme(mode: "dark" | "light"): Theme {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: isDark ? "#e8dfd1" : "#4a453c" },
      secondary: { main: isDark ? "#38bdf8" : "#0f6fbd" },
      error: { main: isDark ? "#ff5c7a" : "#b0344a" },
      warning: { main: isDark ? "#ffd166" : "#9a5a00" },
      info: { main: isDark ? "#38bdf8" : "#0f6fbd" },
      success: { main: isDark ? "#e8dfd1" : "#4a453c" },
      background: {
        default: isDark ? "#0a0a0a" : "#fafaf9",
        paper: isDark ? "#121212" : "#ffffff",
      },
      text: {
        primary: isDark ? "#f0ede3" : "#242320",
        secondary: isDark ? "#b9b2a8" : "#6e6a60",
      },
    },
    typography: {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            border: `1px solid ${isDark ? "#3a3a3a" : "#d9d5cb"}`,
          },
        },
      },
    },
  });
}
