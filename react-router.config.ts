import type { Config } from "@react-router/dev";

export default {
  ssr: true,
  future: {
    unstable_viteEnvironmentApi: true,
  },
} satisfies Config;
