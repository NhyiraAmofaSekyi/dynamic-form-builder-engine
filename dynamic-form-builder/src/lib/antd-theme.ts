import type { ThemeConfig } from "antd";

export const antdTheme: ThemeConfig = {
  token: {
    fontSize: 14,
    colorPrimary: "#328f97",        // --lagoon-deep
    colorInfo: "#328f97",
    colorSuccess: "#2f6a4a",        // --palm
    colorTextBase: "#173a40",       // --sea-ink
    colorBorder: "rgba(23, 58, 64, 0.14)", // --line
    borderRadius: 10,               // ~ --radius 0.625rem
    fontFamily: "'Geist Variable', sans-serif",
  },
  components: {
    Input: { controlHeight: 36 },
    DatePicker: { controlHeight: 36 },
    Statistic: { contentFontSize: 14 },
    Select: { controlHeight: 36 },
    Button: {
      controlHeight: 36,
      colorPrimary: "#328f97",
      colorPrimaryHover: "#4fb8b2", // --lagoon
      colorPrimaryActive: "#246f76",
    },
    Table: {
      headerBg: "#ffffff",
      headerSplitColor: "#ffffff",
      borderColor: "rgba(23, 58, 64, 0.14)", // --line
      rowHoverBg: "rgba(79, 184, 178, 0.08)", // soft --lagoon tint
    },
    Segmented: {
      trackBg: "#F0F0F0",
      controlHeight: 40,
      controlPaddingHorizontal: 16,
      itemSelectedBg: "#FFFFFF",
      borderRadius: 8,
    },
  },
};