import { useTheme } from "../context/ThemeContext";
import { Brightness4, Brightness7 } from "@mui/icons-material";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        background: "none",
        border: "1px solid var(--border)",
        borderRadius: 6,
        color: "var(--text)",
        cursor: "pointer",
        padding: "6px 10px",
        fontFamily: "inherit",
        fontSize: 14,
        display: "flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {isDark ? <Brightness7 style={{ fontSize: 18 }} /> : <Brightness4 style={{ fontSize: 18 }} />}
      <span style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
