import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import path from "path";

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  css: {
    modules: {
      // Generate scoped class names in both dev and prod
      generateScopedName: "[name]__[local]___[hash:base64:5]",
      // Ensure consistent class name generation
      localsConvention: "camelCaseOnly",
    },
    // Enable CSS sourcemaps in development
    //devSourcemap: true,
  },
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      experimental: { remoteBindings: true },
    }),
    reactRouter(),
    tsconfigPaths(),
    svgr({
      svgrOptions: {
        icon: true,
      },
      include: "**/*.svg",
    }),
  ],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./app") },
      { find: "@public", replacement: path.resolve(__dirname, "./public") },
    ],
  },
  build: {
    // cssCodeSplit: false,  some problems with styles
    // rollupOptions: {
    //   output: {
    //     manualChunks: (id) => {
    //       if (id.includes("node_modules")) {
    //         return "vendor";
    //       }
    //       if (id.includes("routes/")) {
    //         const fileName = id.split("/").pop()?.split(".")[0];
    //         if (fileName) return `route-${fileName}`;
    //       }
    //     },
    //     chunkFileNames: "assets/[name]-[hash].js",
    //     entryFileNames: "assets/[name]-[hash].js",
    //     assetFileNames: "assets/[name]-[hash][extname]",
    //   },
    // },
  },
});
