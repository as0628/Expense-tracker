document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    console.log("Login response:", data); // 👈 debug

    if (res.ok) {
      // ✅ Save token + premium flag in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('isPremium', data.isPremium);

      //alert('Login successful!');

      // ✅ Redirect based on premium status
      if (data.isPremium === 1 || data.isPremium === true) {
        window.location.href = 'premiumexpense.html';
      } else {
        window.location.href = 'expense.html';
      }
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error('Login error:', err);
   // alert('Something went wrong');
  }
});
