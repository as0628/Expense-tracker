module.exports = {
  apps: [
    {
      name: "expense-tracker",
      script: "./app.js",        // change if your main file is index.js
      watch: true,
      env: {
        NODE_ENV: "production",
        BASE_URL: "http://13.126.95.171:3000", // your AWS public URL
        CASHFREE_APP_ID: "YOUR_CASHFREE_APP_ID",
        CASHFREE_SECRET_KEY: "YOUR_CASHFREE_SECRET_KEY"
      }
    }
  ]
};
