import { COLORS } from "@pm/config";

export const theme = {
  colors: COLORS,
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 6, md: 10, lg: 16, pill: 999 },
  font: {
    h1: 26,
    h2: 20,
    h3: 17,
    body: 15,
    small: 13,
    tiny: 11,
  },
} as const;

export type Theme = typeof theme;
