/**
 * StackSense Design System Tokens
 * Calm, confident, editorial, "less but better" (Linear / Vercel / Stripe inspired)
 */

export const THEME_TOKENS = {
  colors: {
    dark: {
      background: "#0B0C0E",
      surface: "#121419",
      raised: "#181B22",
      overlay: "#1E222A",
      borderSubtle: "rgba(255, 255, 255, 0.06)",
      borderHover: "rgba(255, 255, 255, 0.12)",
      borderStrong: "rgba(255, 255, 255, 0.18)",
      textPrimary: "#ECEDEF",
      textSecondary: "#A0A4AB",
      textTertiary: "#6B7078",
      accent: "#6E7BFF",
      accentHover: "#828DFF",
      accentMuted: "rgba(110, 123, 255, 0.12)",
      accentForeground: "#FFFFFF",
      semantic: {
        warning: "#F59E0B",
        warningMuted: "rgba(245, 158, 11, 0.10)",
        warningBorder: "rgba(245, 158, 11, 0.25)",
        danger: "#EF4444",
        dangerMuted: "rgba(239, 68, 68, 0.10)",
        dangerBorder: "rgba(239, 68, 68, 0.25)",
        success: "#34D399",
        successMuted: "rgba(52, 211, 153, 0.10)",
        successBorder: "rgba(52, 211, 153, 0.25)",
      },
    },
    light: {
      background: "#F8F9FA",
      surface: "#FFFFFF",
      raised: "#F1F3F5",
      overlay: "#FFFFFF",
      borderSubtle: "rgba(0, 0, 0, 0.06)",
      borderHover: "rgba(0, 0, 0, 0.12)",
      borderStrong: "rgba(0, 0, 0, 0.18)",
      textPrimary: "#111318",
      textSecondary: "#525866",
      textTertiary: "#8A909E",
      accent: "#4F5BD5",
      accentHover: "#3E4AB8",
      accentMuted: "rgba(79, 91, 213, 0.08)",
      accentForeground: "#FFFFFF",
      semantic: {
        warning: "#D97706",
        warningMuted: "rgba(217, 119, 6, 0.08)",
        warningBorder: "rgba(217, 119, 6, 0.20)",
        danger: "#DC2626",
        dangerMuted: "rgba(220, 38, 38, 0.08)",
        dangerBorder: "rgba(220, 38, 38, 0.20)",
        success: "#059669",
        successMuted: "rgba(5, 150, 105, 0.08)",
        successBorder: "rgba(5, 150, 105, 0.20)",
      },
    },
  },
  typography: {
    scale: {
      pageTitle: {
        fontSize: "30px",
        fontWeight: "600",
        letterSpacing: "-0.02em",
        lineHeight: "1.25",
      },
      sectionTitle: {
        fontSize: "19px",
        fontWeight: "600",
        letterSpacing: "-0.01em",
        lineHeight: "1.35",
      },
      cardTitle: {
        fontSize: "16px",
        fontWeight: "600",
        letterSpacing: "-0.01em",
        lineHeight: "1.4",
      },
      body: {
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "1.6",
      },
      bodySmall: {
        fontSize: "13px",
        fontWeight: "400",
        lineHeight: "1.5",
      },
      label: {
        fontSize: "12px",
        fontWeight: "500",
        textTransform: "uppercase" as const,
        letterSpacing: "0.04em",
      },
      metric: {
        fontSize: "24px",
        fontWeight: "600",
        fontVariantNumeric: "tabular-nums",
      },
    },
  },
  spacing: {
    grid: 8,
    sectionGap: "36px",
    cardPadding: "24px",
    maxContentWidth: "1160px",
  },
  radii: {
    card: "12px",
    control: "8px",
    tag: "6px",
    pill: "9999px",
  },
  transitions: {
    default: "150ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

export type ThemeTokens = typeof THEME_TOKENS;
