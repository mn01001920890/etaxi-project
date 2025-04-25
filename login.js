document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;

  fetch('https://api.etaxi.sa.com/api/v1/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mobile: phone,
      password: password
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.access_token) {
        // ✅ تسجيل الدخول ناجح - تخزين التوكن
        localStorage.setItem('access_token', data.access_token);
        window.location.href = 'dashboard.html';
      } else {
        document.getElementById('error').textContent = data.message || 'بيانات الدخول غير صحيحة.';
      }
    })
    .catch(() => {
      document.getElementById('error').textContent = 'حدث خطأ في الاتصال بالسيرفر.';
    });
});
