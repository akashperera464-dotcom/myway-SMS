// vite.config.ts
import { defineConfig } from "file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/vite@5.4.21_@types+node@25.3.5_lightningcss@1.31.1/node_modules/vite/dist/node/index.js";
import react from "file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/@vitejs+plugin-react@4.7.0__fa73262e6718220f4e882b8152ad6d4b/node_modules/@vitejs/plugin-react/dist/index.js";
import tailwindcss from "file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/@tailwindcss+vite@4.2.1_vit_7cc9c54597a92841fbd5176b4011a153/node_modules/@tailwindcss/vite/dist/index.mjs";
import path from "path";
import runtimeErrorOverlay from "file:///E:/antigravity/myway/Myway-student%20manegement%20system/node_modules/.pnpm/@replit+vite-plugin-runtime-error-modal@0.0.6/node_modules/@replit/vite-plugin-runtime-error-modal/dist/index.mjs";
var __vite_injected_original_dirname = "E:\\antigravity\\myway\\Myway-student manegement system\\artifacts\\myway";
var rawPort = process.env.PORT;
if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided."
  );
}
var port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}
var basePath = process.env.BASE_PATH;
if (!basePath) {
  throw new Error(
    "BASE_PATH environment variable is required but was not provided."
  );
}
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxhbnRpZ3Jhdml0eVxcXFxteXdheVxcXFxNeXdheS1zdHVkZW50IG1hbmVnZW1lbnQgc3lzdGVtXFxcXGFydGlmYWN0c1xcXFxteXdheVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRTpcXFxcYW50aWdyYXZpdHlcXFxcbXl3YXlcXFxcTXl3YXktc3R1ZGVudCBtYW5lZ2VtZW50IHN5c3RlbVxcXFxhcnRpZmFjdHNcXFxcbXl3YXlcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0U6L2FudGlncmF2aXR5L215d2F5L015d2F5LXN0dWRlbnQlMjBtYW5lZ2VtZW50JTIwc3lzdGVtL2FydGlmYWN0cy9teXdheS92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSBcIkB0YWlsd2luZGNzcy92aXRlXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHJ1bnRpbWVFcnJvck92ZXJsYXkgZnJvbSBcIkByZXBsaXQvdml0ZS1wbHVnaW4tcnVudGltZS1lcnJvci1tb2RhbFwiO1xuXG5jb25zdCByYXdQb3J0ID0gcHJvY2Vzcy5lbnYuUE9SVDtcblxuaWYgKCFyYXdQb3J0KSB7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICBcIlBPUlQgZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgcmVxdWlyZWQgYnV0IHdhcyBub3QgcHJvdmlkZWQuXCIsXG4gICk7XG59XG5cbmNvbnN0IHBvcnQgPSBOdW1iZXIocmF3UG9ydCk7XG5cbmlmIChOdW1iZXIuaXNOYU4ocG9ydCkgfHwgcG9ydCA8PSAwKSB7XG4gIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBQT1JUIHZhbHVlOiBcIiR7cmF3UG9ydH1cImApO1xufVxuXG5jb25zdCBiYXNlUGF0aCA9IHByb2Nlc3MuZW52LkJBU0VfUEFUSDtcblxuaWYgKCFiYXNlUGF0aCkge1xuICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgXCJCQVNFX1BBVEggZW52aXJvbm1lbnQgdmFyaWFibGUgaXMgcmVxdWlyZWQgYnV0IHdhcyBub3QgcHJvdmlkZWQuXCIsXG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJhc2U6IGJhc2VQYXRoLFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB0YWlsd2luZGNzcygpLFxuICAgIHJ1bnRpbWVFcnJvck92ZXJsYXkoKSxcbiAgICAuLi4ocHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09IFwicHJvZHVjdGlvblwiICYmXG4gICAgcHJvY2Vzcy5lbnYuUkVQTF9JRCAhPT0gdW5kZWZpbmVkXG4gICAgICA/IFtcbiAgICAgICAgICBhd2FpdCBpbXBvcnQoXCJAcmVwbGl0L3ZpdGUtcGx1Z2luLWNhcnRvZ3JhcGhlclwiKS50aGVuKChtKSA9PlxuICAgICAgICAgICAgbS5jYXJ0b2dyYXBoZXIoe1xuICAgICAgICAgICAgICByb290OiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCIuLlwiKSxcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICksXG4gICAgICAgICAgYXdhaXQgaW1wb3J0KFwiQHJlcGxpdC92aXRlLXBsdWdpbi1kZXYtYmFubmVyXCIpLnRoZW4oKG0pID0+XG4gICAgICAgICAgICBtLmRldkJhbm5lcigpLFxuICAgICAgICAgICksXG4gICAgICAgIF1cbiAgICAgIDogW10pLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoaW1wb3J0Lm1ldGEuZGlybmFtZSwgXCJzcmNcIiksXG4gICAgICBcIkBhc3NldHNcIjogcGF0aC5yZXNvbHZlKGltcG9ydC5tZXRhLmRpcm5hbWUsIFwiLi5cIiwgXCIuLlwiLCBcImF0dGFjaGVkX2Fzc2V0c1wiKSxcbiAgICB9LFxuICAgIGRlZHVwZTogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIl0sXG4gIH0sXG4gIHJvb3Q6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lKSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6IHBhdGgucmVzb2x2ZShpbXBvcnQubWV0YS5kaXJuYW1lLCBcImRpc3QvcHVibGljXCIpLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlLFxuICB9LFxuICBzZXJ2ZXI6IHtcbiAgICBwb3J0LFxuICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICAgIGZzOiB7XG4gICAgICBzdHJpY3Q6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgcHJldmlldzoge1xuICAgIHBvcnQsXG4gICAgaG9zdDogXCIwLjAuMC4wXCIsXG4gICAgYWxsb3dlZEhvc3RzOiB0cnVlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQThZLFNBQVMsb0JBQW9CO0FBQzNhLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUN4QixPQUFPLFVBQVU7QUFDakIsT0FBTyx5QkFBeUI7QUFKaEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTSxVQUFVLFFBQVEsSUFBSTtBQUU1QixJQUFJLENBQUMsU0FBUztBQUNaLFFBQU0sSUFBSTtBQUFBLElBQ1I7QUFBQSxFQUNGO0FBQ0Y7QUFFQSxJQUFNLE9BQU8sT0FBTyxPQUFPO0FBRTNCLElBQUksT0FBTyxNQUFNLElBQUksS0FBSyxRQUFRLEdBQUc7QUFDbkMsUUFBTSxJQUFJLE1BQU0sd0JBQXdCLE9BQU8sR0FBRztBQUNwRDtBQUVBLElBQU0sV0FBVyxRQUFRLElBQUk7QUFFN0IsSUFBSSxDQUFDLFVBQVU7QUFDYixRQUFNLElBQUk7QUFBQSxJQUNSO0FBQUEsRUFDRjtBQUNGO0FBRUEsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsTUFBTTtBQUFBLEVBQ04sU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osb0JBQW9CO0FBQUEsSUFDcEIsR0FBSSxRQUFRLElBQUksYUFBYSxnQkFDN0IsUUFBUSxJQUFJLFlBQVksU0FDcEI7QUFBQSxNQUNFLE1BQU0sT0FBTyx5TEFBa0MsRUFBRTtBQUFBLFFBQUssQ0FBQyxNQUNyRCxFQUFFLGFBQWE7QUFBQSxVQUNiLE1BQU0sS0FBSyxRQUFRLGtDQUFxQixJQUFJO0FBQUEsUUFDOUMsQ0FBQztBQUFBLE1BQ0g7QUFBQSxNQUNBLE1BQU0sT0FBTyxxTEFBZ0MsRUFBRTtBQUFBLFFBQUssQ0FBQyxNQUNuRCxFQUFFLFVBQVU7QUFBQSxNQUNkO0FBQUEsSUFDRixJQUNBLENBQUM7QUFBQSxFQUNQO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBcUIsS0FBSztBQUFBLE1BQzVDLFdBQVcsS0FBSyxRQUFRLGtDQUFxQixNQUFNLE1BQU0saUJBQWlCO0FBQUEsSUFDNUU7QUFBQSxJQUNBLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFBQSxFQUMvQjtBQUFBLEVBQ0EsTUFBTSxLQUFLLFFBQVEsZ0NBQW1CO0FBQUEsRUFDdEMsT0FBTztBQUFBLElBQ0wsUUFBUSxLQUFLLFFBQVEsa0NBQXFCLGFBQWE7QUFBQSxJQUN2RCxhQUFhO0FBQUEsRUFDZjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ047QUFBQSxJQUNBLFlBQVk7QUFBQSxJQUNaLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxJQUNkLElBQUk7QUFBQSxNQUNGLFFBQVE7QUFBQSxJQUNWO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1A7QUFBQSxJQUNBLE1BQU07QUFBQSxJQUNOLGNBQWM7QUFBQSxFQUNoQjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
