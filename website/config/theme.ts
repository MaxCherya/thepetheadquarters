export const colors = {
  black: "#111111",
  gold: "#C6A030",
  goldDark: "#876B1E",
  goldLight: "#DEAF3A",

  white: "#111111",
  whiteDim: "#2D2D2D",
  whiteFaint: "#555555",

  bgPrimary: "#F4F1EA",
  bgSecondary: "#FFFFFF",
  bgTertiary: "#EBE7DE",
  bgBorder: "#DED9CF",

  success: "#2E7D32",
  warning: "#E65100",
  error: "#C62828",
  info: "#1565C0",
} as const;

export const fonts = {
  heading: "var(--font-cormorant)",
  body: "var(--font-montserrat)",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

export const containers = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
