const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : ""; // empty = same domain in production

export default API_BASE_URL;
