export default {
  expo: {
    name: "MindSpring",
    slug: "mindspring",
    version: "1.0.0",
    android: {
      package: "com.ecocat.mindspring",
      permissions: ["RECORD_AUDIO"]
    },
    web: {
      bundler: "metro",
      output: "single",
      publicPath: "/mindspring"   // <-- important for GitHub Pages subpath
    },
    extra: {
      eas: { projectId: "3b43b80f-77c8-4160-830f-c0897cf8c1af" }
    }
  }
};
