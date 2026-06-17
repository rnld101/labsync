// Design tokens mirrored from BLUEPRINT.md section 3 for use in TS (charts, inline styles, etc.).
export const tokens = {
  colors: {
    primary: "#008080",
    background: "#FFFFFF",
    surface: "#F8FAFC",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    textDark: "#0F172A",
    textMuted: "#64748B",
  },
  borderRadius: {
    bento: "1rem",
  },
  boxShadow: {
    bentoDiffused:
      "0 10px 25px -5px rgba(0, 128, 128, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
  },
} as const;
