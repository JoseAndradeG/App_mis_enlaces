import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tinta: "#1F2A37",
        papel: "#E4E6EA",
        acento: "#3B5BDB",
      },
    },
  },
  plugins: [],
};
export default config;
