document.getElementById('auth-form').addEventListener('submit', async e => {
  e.preventDefault();

  const name     = e.target.name.value.trim();
  const email    = e.target.email.value.trim();
  const password = e.target.password.value;

  const payload = { name, email, password };

  // Log what's being submitted
  console.log("Form submission payload:", payload);

  // Example POST to backend (commented out until backend is ready)
  /*
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      console.log('Success response:', data);
      localStorage.setItem('token', data.token);
      window.location.href = 'dashboard.html';
    } else {
      console.error('Server error:', data);
      alert(data.error || 'Something went wrong');
    }
  } catch (err) {
    console.error('Network error:', err);
    alert('Network error');
  }
  */
});
