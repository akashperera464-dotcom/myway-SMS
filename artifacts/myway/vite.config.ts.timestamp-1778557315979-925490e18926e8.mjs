// vite.config.ts
import { defineConfig } from "file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/vite@5.4.21_@types+node@25.3.5_lightningcss@1.31.1/node_modules/vite/dist/node/index.js";
import react from "file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/@vitejs+plugin-react@4.7.0__fa73262e6718220f4e882b8152ad6d4b/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/@tailwindcss+vite@4.2.1_vit_7cc9c54597a92841fbd5176b4011a153/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import runtimeErrorOverlay from "file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/@replit+vite-plugin-runtime-error-modal@0.0.6/node_modules/@replit/vite-plugin-runtime-error-modal/dist/index.mjs";
var __vite_injected_original_dirname = "E:\\antigravity\\myway\\Myway-student manegement system\\artifacts\\myway";
var port = process.env.PORT ? Number(process.env.PORT) : 5173;
var basePath = process.env.BASE_PATH || "/";
var vite_config_default = defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/@replit+vite-plugin-cartographer@0.5.1/node_modules/@replit/vite-plugin-cartographer/dist/index.mjs").then(
        (m) => m.cartographer({
          root: path.resolve(__vite_injected_original_dirname, "..")
        })
      ),
      await import("file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/@replit+vite-plugin-dev-banner@0.1.2/node_modules/@replit/vite-plugin-dev-banner/dist/index.mjs").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src"),
      "@assets": path.resolve(__vite_injected_original_dirname, "..", "..", "attached_assets")
    },
    dedupe: ["react", "react-dom"]
  },
  root: path.resolve(__vite_injected_original_dirname),
  build: {
    outDir: path.resolve(__vite_injected_original_dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true
    }
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxhbnRpZ3Jhdml0eVxcXFxteXdheVxcXFxNeXdheS1zdHVkZW50IG1hbmVnZW1lbnQgc3lzdGVtXFxcXGFydGlmYWN0c1xcXFxteXdheVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcYW50aWdyYXZpdHlcXFxcbXl3YXlcXFxcTXl3YXktc3R1ZGVudCBtYW5lZ2VtZW50IHN5c3RlbVxcXFxhcnRpZmFjdHNcXFxcbXl3YXlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2FudGlncmF2aXR5L215d2F5L015d2F5LXN0dWRlbnQlMjBtYW5lZ2VtZW50JTIwc3lzdGVtL2FydGlmYWN0cy9teXdheS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHJ1bnRpbWVFcnJvck92ZXJsYXkgZnJvbSBcIkByZXBsaXQvdml0ZS1wbHVnaW4tcnVudGltZS1lcnJvci1tb2RhbFwiO1xuXG5jb25zdCBwb3J0ID0gcHJvY2Vzcy5lbnYuUE9SVCA/IE51bWJlcihwcm9jZXNzLmVudi5QT1JUKSA6IDUxNzM7XG5jb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuZW52LkJBU0VfUEFUSCB8fCBcIi9cIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogYmFzZVBhdGgsXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIHRhaWx3aW5kY3NzKCksXG4gICAgcnVudGltZUVycm9yT3ZlcmxheSgpLFxuICAgIC4uLihwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIgJiZcbiAgICBwcm9jZXNzLmVudi5SRVBMX0lEICE9PSB1bmRlZmluZWRcbiAgICAgID8gW1xuICAgICAgICAgIGF3YWl0IGltcG9ydChcIkByZXBsaXQvdml0ZS1wbHVnaW4tY2FydG9ncmFwaGVyXCIpLnRoZW4oKG0pID0+XG4gICAgICAgICAgICBtLmNhcnRvZ3JhcGhlcih7XG4gICAgICAgICAgICAgIHJvb3Q6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcIi4uXCIpLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgKSxcbiAgICAgICAgICBhd2FpdCBpbXBvcnQoXCJAcmVwbGl0L3ZpdGUtcGx1Z2luLWRldi1iYW5uZXJcIikudGhlbigobSkgPT5cbiAgICAgICAgICAgIG0uZGV2QmFubmVyKCksXG4gICAgICAgICAgKSxcbiAgICAgICAgXVxuICAgICAgOiBbXSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcInNyY1wiKSxcbiAgICAgIFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCIuLlwiLCBcIi4uXCIsIFwiYXR0YWNoZWRfYXNzZXRzXCIpLFxuICAgIH0sXG4gICAgZGVkdXBlOiBbXCJyZWFjdFwiLCBcInJlYWN0LWRvbVwiXSxcbiAgfSxcbiAgcm9vdDogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUpLFxuICBidWlsZDoge1xuICAgIG91dERpcjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiZGlzdC9wdWJsaWNcIiksXG4gICAgZW1wdHlPdXREaXI6IHRydWUsXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQsXG4gICAgc3RyaWN0UG9ydDogdHJ1ZSxcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gICAgZnM6IHtcbiAgICAgIHN0cmljdDogdHJ1ZSxcbiAgICB9LFxuICB9LFxuICBwcmV2aWV3OiB7XG4gICAgcG9ydCxcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBhbGxvd2VkSG9zdHM6IHRydWUsXG4gIH0sXG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBOFksU0FBUyxvQkFBb0I7QUFDM2EsT0FBTyxXQUFXO0FBQ2xCLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sVUFBVTtBQUNqQixPQUFPLHlCQUF5QjtBQUpoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFNLE9BQU8sUUFBUSxJQUFJLE9BQU8sT0FBTyxRQUFRLElBQUksSUFBSSxJQUFJO0FBQzNELElBQU0sV0FBVyxRQUFRLElBQUksYUFBYTtBQUUxQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixvQkFBb0I7QUFBQSxJQUNwQixHQUFJLFFBQVEsSUFBSSxhQUFhLGdCQUM3QixRQUFRLElBQUksWUFBWSxTQUNwQjtBQUFBLE1BQ0UsTUFBTSxPQUFPLHlMQUFrQyxFQUFFO0FBQUEsUUFBSyxDQUFDLE1BQ3JELEVBQUUsYUFBYTtBQUFBLFVBQ2IsTUFBTSxLQUFLLFFBQVEsa0NBQXFCLElBQUk7QUFBQSxRQUM5QyxDQUFDO0FBQUEsTUFDSDtBQUFBLE1BQ0EsTUFBTSxPQUFPLHFMQUFnQyxFQUFFO0FBQUEsUUFBSyxDQUFDLE1BQ25ELEVBQUUsVUFBVTtBQUFBLE1BQ2Q7QUFBQSxJQUNGLElBQ0EsQ0FBQztBQUFBLEVBQ1A7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFxQixLQUFLO0FBQUEsTUFDNUMsV0FBVyxLQUFLLFFBQVEsa0NBQXFCLE1BQU0sTUFBTSxpQkFBaUI7QUFBQSxJQUM1RTtBQUFBLElBQ0EsUUFBUSxDQUFDLFNBQVMsV0FBVztBQUFBLEVBQy9CO0FBQUEsRUFDQSxNQUFNLEtBQUssUUFBUSxnQ0FBbUI7QUFBQSxFQUN0QyxPQUFPO0FBQUEsSUFDTCxRQUFRLEtBQUssUUFBUSxrQ0FBcUIsYUFBYTtBQUFBLElBQ3ZELGFBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxRQUFRO0FBQUEsSUFDTjtBQUFBLElBQ0EsWUFBWTtBQUFBLElBQ1osTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLElBQ2QsSUFBSTtBQUFBLE1BQ0YsUUFBUTtBQUFBLElBQ1Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUDtBQUFBLElBQ0EsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLEVBQ2hCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
