const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "http://3.109.62.226"; 

export default API_BASE_URL;
