const BASE_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000/api"
  : "http://3.110.204.39:3000/api";

document.getElementById('auth-form').addEventListener('submit', async e => {
  e.preventDefault();

  const name     = e.target.name.value.trim();
  const email    = e.target.email.value.trim();
  const password = e.target.password.value;

  const payload = { name, email, password };

  console.log("Form submission payload:", payload);

  try {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok) {
      console.log('Success response:', data);
      // alert('Signup successful!');
      // Redirect to login page
      window.location.href = 'login.html';
    } else {
      console.error('Server error:', data);
      alert(data.error || 'Something went wrong');
    }
  } catch (err) {
    console.error('Network error:', err);
    alert('Network error');
  }
});
