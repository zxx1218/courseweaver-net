import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 10001,
    // 新增：允许 jk.fortunefreedom.top 主机访问
    allowedHosts: [
      "jk.fortunefreedom.top",
      "fortunefreedom.top",
      "localhost",
      "127.0.0.1",
      "[::1]" // 对应 host: "::" 的 IPv6 本地地址，保留兼容性
    ]
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));