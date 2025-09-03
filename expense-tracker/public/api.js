const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : ""; 

export default API_BASE_URL;
