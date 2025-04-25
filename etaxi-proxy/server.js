const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const LOGIN_URL = 'https://api.etaxi.sa.com/api/v1/auth';
const QUEUE_URL = 'https://api.etaxi.sa.com/portal/api/v1/live_queues/liveQueuesCount';
const PAYMENTS_URL = 'https://api.etaxi.sa.com/portal/api/v1/payments/list';
const ORDERS_URL = 'https://api.etaxi.sa.com/portal/api/v1/requests/acceptedRequest';




// ✅ تسجيل الدخول
app.post('/login', async (req, res) => {
  try {
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile: req.body.user,
        password: req.body.pass
      })
    });

    const data = await response.json();

    if (response.ok) {
      res.json(data); // بيرجع access_token
    } else {
      res.status(401).json({ message: 'فشل تسجيل الدخول', error: data });
    }
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الاتصال بالسيرفر', error: error.message });
  }
});

// 📥 استدعاء بيانات الطوابير
app.get('/liveQueues', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    const response = await fetch(QUEUE_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(403).json({ message: 'فشل جلب الطوابير', error: data });
    }
  } catch (error) {
    res.status(500).json({ message: 'خطأ داخلي في السيرفر', error: error.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
});


// 🧾 استدعاء بيانات المدفوعات
	app.get('/payments', async (req, res) => {
	  try {
		const token = req.headers.authorization?.split(' ')[1];

		const response = await fetch(`${PAYMENTS_URL}?page_number=1&page_size=20`, {
		  method: 'GET',
		  headers: {
			'Authorization': `Bearer ${token}`
		  }
		});

		const data = await response.json();

		if (response.ok) {
		  res.json(data);
		} else {
		  res.status(403).json({ message: 'فشل جلب المدفوعات', error: data });
		}
	  } catch (error) {
		res.status(500).json({ message: 'خطأ داخلي في السيرفر', error: error.message });
	  }
	});
	
	
	// 📦 استدعاء بيانات الطلبات
	app.get('/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    const page = req.query.page_number || 0; // لاحظ إنه بيبدأ من 0 في acceptedRequest
    const size = req.query.page_size || 50;
    const dateFrom = req.query.date_from;
    const dateTo = req.query.date_to;

    let url = `${ORDERS_URL}?page_number=${page}&page_size=${size}`;
    if (dateFrom) url += `&date_from=${dateFrom}`;
    if (dateTo) url += `&date_to=${dateTo}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      res.json(data);
    } else {
      res.status(403).json({ message: 'فشل في جلب الطلبات', error: data });
    }
  } catch (error) {
    res.status(500).json({ message: 'خطأ داخلي في السيرفر', error: error.message });
  }
});
