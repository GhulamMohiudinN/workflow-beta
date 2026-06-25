/**
 * Spacing and Layout Configuration
 * Consistent spacing scale for all components
 */

export const spacing = {
  // Base spacing units (in rem)
  0: "0",
  1: "0.25rem", // 4px
  2: "0.5rem", // 8px
  3: "0.75rem", // 12px
  4: "1rem", // 16px
  5: "1.25rem", // 20px
  6: "1.5rem", // 24px
  8: "2rem", // 32px
  10: "2.5rem", // 40px
  12: "3rem", // 48px
  16: "4rem", // 64px
  20: "5rem", // 80px
  24: "6rem", // 96px
  32: "8rem", // 128px
};

export const layout = {
  // Container widths
  container: {
    xs: "20rem", // 320px
    sm: "24rem", // 384px
    md: "28rem", // 448px
    lg: "32rem", // 512px
    xl: "36rem", // 576px
    "2xl": "42rem", // 672px
    "3xl": "48rem", // 768px
    "4xl": "56rem", // 896px
    "5xl": "64rem", // 1024px
    "6xl": "72rem", // 1152px
  },

  // Sidebar widths
  sidebar: {
    closed: "4rem", // 64px (icon-only)
    open: "16rem", // 256px
  },

  // Header height
  header: {
    mobile: "3.5rem", // 56px
    desktop: "4rem", // 64px
  },

  // Footer height
  footer: {
    default: "3.5rem", // 56px
  },

  // Border radius
  radius: {
    none: "0",
    sm: "0.25rem", // 4px
    base: "0.375rem", // 6px
    md: "0.5rem", // 8px
    lg: "0.75rem", // 12px
    xl: "1rem", // 16px
    "2xl": "1.5rem", // 24px
    "3xl": "2rem", // 32px
    full: "9999px",
  },

  // Z-index scale
  zIndex: {
    auto: "auto",
    0: "0",
    10: "10",
    20: "20",
    30: "30",
    40: "40",
    50: "50",
    dropdown: "100",
    sticky: "20",
    fixed: "30",
    modal: "40",
    popover: "50",
    tooltip: "100",
  },
};

export const breakpoints = {
  xs: "0px",
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

export default { spacing, layout, breakpoints };
