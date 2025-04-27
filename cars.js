// cars.js

let allCarsData = [];     // تخزين كل النتائج هنا
let currentPage = 1;      // الصفحة الحالية
const pageSize = 10000;     // عدد النتائج في كل صفحة

// 🔵 تحميل البيانات من السيرفر
function fetchCarsData(dateFrom = '', dateTo = '') {
  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('يرجى تسجيل الدخول أولاً');
    return;
  }
 
let url = 'https://api.etaxi.sa.com/portal/api/v1/live_queue_actions?page_number=0&page_size=1500&area_id=1';


  if (dateFrom && dateTo) {
  
	 url += `&date_from=${dateFrom}T00:00:00&date_to=${dateTo}T23:59:59`;

  }

  fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error('فشل في تحميل البيانات');
      return res.json();
    })
    .then(data => {
      if (data.results && data.results.length > 0) {
        allCarsData = data.results;   // تخزين النتائج
        currentPage = 1;              // ارجاع إلى الصفحة الأولى
        renderCarsPage(currentPage);  // عرض الصفحة الأولى
      } else {
        displayEmptyMessage();
      }
    })
    .catch(error => {
      alert('خطأ في الشبكة: ' + error.message);
    });
}

// 🖥️ عرض بيانات صفحة معينة
function renderCarsPage(page) {
  const tbody = document.getElementById('carsBody');
  tbody.innerHTML = '';

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = allCarsData.slice(startIndex, endIndex);

  if (pageData.length === 0) {
    displayEmptyMessage();
    return;
  }

  let rowsHtml = '';
  pageData.forEach((item, index) => {
    rowsHtml += `
      <tr>
        <td>${startIndex + index + 1}</td>
        <td>${item.car?.car_id || '-'}</td>
        <td>${item.car?.car_plate || '-'}</td>
        <td>${item.car?.car_model_year || '-'}</td>
        <td>${item.user?.full_name || '-'}</td>
        <td>${item.user?.mobile || '-'}</td>
        <td>${item.queue?.queue_name || '-'}</td>
        <td>${item.area?.area_name_ar || '-'}</td>
        <td style="color: ${item.enter_action ? 'green' : 'red'};">
          ${item.enter_action ? '✅' : '❌'}
        </td>
        <td style="color: ${item.exit_action ? 'green' : 'red'};">
          ${item.exit_action ? '✅' : '❌'}
        </td>
        <td>${item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : '-'}</td>
        <td style="color: ${item.exit_action ? 'black' : 'red'};">
          ${item.exit_action ? new Date(item.updated_at).toLocaleString('ar-EG') : '❌ لم يخرج بعد'}
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = rowsHtml;
  renderPagination();
}

// 🖥️ عرض بيانات صفحة معينة
function renderPagination() {
  let paginationDiv = document.getElementById('paginationControls');
  
  if (!paginationDiv) {
    paginationDiv = document.createElement('div');
    paginationDiv.id = 'paginationControls';
    paginationDiv.style.marginTop = '20px';
    paginationDiv.style.textAlign = 'center';
    document.getElementById('carsContainer').appendChild(paginationDiv);
  }

  if (allCarsData.length <= pageSize) {
    paginationDiv.innerHTML = ''; // ❌ لو البيانات أقل من حجم صفحة واحدة، نخفي أزرار التنقل
    return;
  }

  paginationDiv.innerHTML = `
    <button onclick="prevPage()" style="margin: 5px; padding: 10px 20px; background-color: #2554C7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">⬅️ السابق</button>
    <span style="margin: 0 10px; font-size: 18px;">صفحة ${currentPage}</span>
    <button onclick="nextPage()" style="margin: 5px; padding: 10px 20px; background-color: #2554C7; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">التالي ➡️</button>
  `;
}

// ➡️ التالي
function nextPage() {
  if (currentPage * pageSize < allCarsData.length) {
    currentPage++;
    renderCarsPage(currentPage);
  }
}

// ⬅️ السابق
function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderCarsPage(currentPage);
  }
}

// 🧹 عرض رسالة عدم وجود بيانات
function displayEmptyMessage() {
  const tbody = document.getElementById('carsBody');
  tbody.innerHTML = `<tr><td colspan="9">لا توجد بيانات</td></tr>`;
}




// 🔍 فلترة حسب التواريخ
if (document.getElementById('filterButton')) {
  document.getElementById('filterButton').addEventListener('click', function () {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    if (!startDate || !endDate) {
      alert('يرجى اختيار تاريخ البداية والنهاية');
      return;
    }

    fetchCarsData(startDate, endDate);
  });
}



// 🔒 حماية من استخدام الكليك يمين و F12
document.addEventListener('contextmenu', function (e) {
  e.preventDefault();
});
document.addEventListener('keydown', function (e) {
  if (e.key === "F12" || 
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) || 
      (e.ctrlKey && e.key === 'U')) {
    e.preventDefault();
  }
});