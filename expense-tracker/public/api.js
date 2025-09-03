// No export, just attach to window
window.API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "http://3.109.62.226:3000";
