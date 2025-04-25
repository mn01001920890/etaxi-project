if (document.getElementById('fetchQueues')) {
  document.getElementById('fetchQueues').addEventListener('click', function () {
    const token = localStorage.getItem('access_token');
    if (!token) return alert('يرجى تسجيل الدخول أولاً');

    fetch('https://api.etaxi.sa.com/portal/api/v1/live_queues/liveQueuesCount', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('فشل في تحميل البيانات');
        return res.json();
      })
      .then(data => {
        const tbody = document.getElementById('queueBody');
        tbody.innerHTML = '';

        if (data.results && data.results.length > 0) {
          data.results.forEach((item, index) => {
			  const row = document.createElement('tr');
			  row.innerHTML = `
				<td style="padding: 10px;">${index + 1}</td>
				<td style="padding: 10px;">${item.queue?.queue_name || 'غير معروف'}</td>
				<td style="padding: 10px;">${item.queue_count ?? 0}</td>
				<td style="padding: 10px;">-</td> <!-- مفيش last_updated في الرد -->
			  `;
			  tbody.appendChild(row);
			});
        } else {
          const row = document.createElement('tr');
          row.innerHTML = `<td colspan="4">لا توجد بيانات</td>`;
          tbody.appendChild(row);
        }
      })
      .catch(error => {
        alert('خطأ الشبكة: ' + error.message);
      });
  });
}


