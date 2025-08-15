export default {
  expo: {
    name: "MindSpring",
    slug: "mindspring",
    version: "1.0.0",
    android: {
      package: "com.ecocat.mindspring",
      permissions: ["RECORD_AUDIO"]
    },
    // Important for GitHub Pages
    web: {
      bundler: "metro",
      output: "single",        // client-only build (no SSR)
      publicPath: "/mindspring" // site lives under /mindspring
    },
    extra: {
      eas: { projectId: "3b43b80f-77c8-4160-830f-c0897cf8c1af" }
    }
  }
};
