/**
 * Typography Configuration
 * Font families, sizes, and weights
 */

export const typography = {
  // Font families
  fontFamily: {
    primary: "var(--font-geist-sans), 'Inter', 'Segoe UI', Roboto, sans-serif",
    mono: "var(--font-geist-mono), 'Fira Code', 'Courier New', monospace",
  },

  // Font sizes with scale
  fontSize: {
    xs: { size: "0.75rem", lineHeight: "1rem" }, // 12px
    sm: { size: "0.875rem", lineHeight: "1.25rem" }, // 14px
    base: { size: "1rem", lineHeight: "1.5rem" }, // 16px
    lg: { size: "1.125rem", lineHeight: "1.75rem" }, // 18px
    xl: { size: "1.25rem", lineHeight: "1.75rem" }, // 20px
    "2xl": { size: "1.5rem", lineHeight: "2rem" }, // 24px
    "3xl": { size: "1.875rem", lineHeight: "2.25rem" }, // 30px
    "4xl": { size: "2.25rem", lineHeight: "2.5rem" }, // 36px
    "5xl": { size: "3rem", lineHeight: "1" }, // 48px
  },

  // Font weights
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Heading styles
  heading: {
    h1: {
      size: "2.25rem",
      weight: 700,
      lineHeight: "2.5rem",
      letterSpacing: "0",
    },
    h2: {
      size: "1.875rem",
      weight: 700,
      lineHeight: "2.25rem",
      letterSpacing: "0",
    },
    h3: {
      size: "1.5rem",
      weight: 600,
      lineHeight: "2rem",
    },
    h4: {
      size: "1.25rem",
      weight: 600,
      lineHeight: "1.75rem",
    },
    h5: {
      size: "1.125rem",
      weight: 600,
      lineHeight: "1.75rem",
    },
    h6: {
      size: "1rem",
      weight: 600,
      lineHeight: "1.5rem",
    },
  },

  // Body text styles
  body: {
    large: {
      size: "1.125rem",
      weight: 400,
      lineHeight: "1.75rem",
    },
    base: {
      size: "1rem",
      weight: 400,
      lineHeight: "1.5rem",
    },
    small: {
      size: "0.875rem",
      weight: 400,
      lineHeight: "1.25rem",
    },
    xs: {
      size: "0.75rem",
      weight: 400,
      lineHeight: "1rem",
    },
  },

  // Labels and captions
  label: {
    size: "0.875rem",
    weight: 500,
    lineHeight: "1.25rem",
  },
  caption: {
    size: "0.75rem",
    weight: 500,
    lineHeight: "1rem",
  },
};

export default typography;
