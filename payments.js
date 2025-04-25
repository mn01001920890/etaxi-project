// ملف payments.js بعد إعادة الكتابة بشكل منظم

// المتغيرات العامة المستخدمة لتتبع حالة العرض والنتائج
let allResults = [];        // مصفوفة لتخزين جميع نتائج المدفوعات التي يتم جلبها من الخادم
let currentPage = 1;        // رقم الصفحة الحالي في عرض النتائج
let pageSize = 0;           // حجم الصفحة الحالي (0 = لم يتم اختيار حجم بعد)
let currentFrom = '';       // تاريخ البداية المحدد للفلترة (إن وجد)
let currentTo = '';         // تاريخ النهاية المحدد للفلترة (إن وجد)

/**
 * دالة لجلب بيانات المدفوعات من واجهة برمجية (API) مع تطبيق عوامل الفلترة حسب التاريخ.
 * @param {string} dateFrom - تاريخ البداية بالصيغة YYYY-MM-DD (يمكن تمرير سلسلة فارغة إذا لا يوجد فلترة).
 * @param {string} dateTo - تاريخ النهاية بالصيغة YYYY-MM-DD (يمكن تمرير سلسلة فارغة إذا لا يوجد فلترة).
 */
function loadPayments(dateFrom = currentFrom, dateTo = currentTo) {
  // التحقق من وجود رمز الدخول (Token) وإلا مطالبة المستخدم بتسجيل الدخول
  const token = localStorage.getItem('access_token');
  if (!token) {
    alert('يجب تسجيل الدخول أولاً');
    window.location.href = 'index.html';
    return;
  }

  // تحديث قيم الفلترة الحالية بالتواريخ الممررة
  currentFrom = dateFrom;
  currentTo = dateTo;

  // تحديد حجم الصفحة المستخدم لجلب البيانات (إذا لم يُحدد pageSize من المستخدم نستخدم 100 كقيمة افتراضية للجلب)
  const fetchPageSize = (pageSize && pageSize > 0) ? pageSize : 100;

  // بناء رابط الـ API مع معلمات الترقيم والفلترة (الصفحة الأولى دائمًا)
  let url = `https://api.etaxi.sa.com/portal/api/v1/payments/list?page_number=1&page_size=${fetchPageSize}`;
  if (currentFrom) {
    url += `&date_from=${currentFrom}T00:00:00`;
  }
  if (currentTo) {
    url += `&date_to=${currentTo}T23:59:59`;
  }

  // طلب البيانات من الخادم باستخدام Fetch API
  fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`  // تمرير رمز التحقق في رأس الطلب
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('فشل في جلب المدفوعات');  // في حال حدوث خطأ من الخادم
      }
      return response.json();
    })
    .then(data => {
      // مراجع لعناصر HTML التي سيتم تحديث محتواها
      const tbody = document.getElementById('paymentsBody');      // جسم الجدول حيث تعرض النتائج
      const countBox = document.getElementById('countBox');       // مربع عرض عدد النتائج الإجمالي
      const emptyMsg = document.getElementById('emptyMessage');   // رسالة عدم وجود بيانات أو انتظار

      // تفريغ المحتويات القديمة من الجدول وعداد النتائج وإخفاء رسالة "لا توجد بيانات"
      tbody.innerHTML = '';
      countBox.textContent = '';
      emptyMsg.style.display = 'none';

      // التحقق من وجود نتائج في البيانات المستلمة
      if (data.results && data.results.length > 0) {
        const totalCount = data.total_count || data.results.length;
        let resultsArray = data.results;

        // إذا كان هناك المزيد من النتائج على صفحات أخرى، نجلبها كلها ونخزنها في resultsArray
        if (resultsArray.length < totalCount) {
          const totalPages = Math.ceil(totalCount / fetchPageSize);
          const promises = [];
          for (let p = 2; p <= totalPages; p++) {
            let pageUrl = `https://api.etaxi.sa.com/portal/api/v1/payments/list?page_number=${p}&page_size=${fetchPageSize}`;
            if (currentFrom) {
              pageUrl += `&date_from=${currentFrom}T00:00:00`;
            }
            if (currentTo) {
              pageUrl += `&date_to=${currentTo}T23:59:59`;
            }
            promises.push(
              fetch(pageUrl, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
              }).then(res => {
                if (!res.ok) throw new Error('فشل في جلب المدفوعات');
                return res.json();
              })
            );
          }
          // جلب جميع الصفحات المتبقية بالتوازي
          Promise.all(promises)
            .then(pages => {
              pages.forEach(pageData => {
                if (pageData.results) {
                  resultsArray = resultsArray.concat(pageData.results);
                }
              });
              // تخزين جميع النتائج وعرضها
              allResults = resultsArray;
              countBox.textContent = `إجمالي النتائج: ${totalCount}`;
              if (pageSize && pageSize > 0) {
                // تم اختيار حجم صفحة من قبل المستخدم: عرض الصفحة الأولى فقط
                currentPage = 1;
                renderPage();
              } else {
                // لم يتم اختيار حجم صفحة: عرض جميع النتائج في جدول واحد
                tbody.innerHTML = '';
                resultsArray.forEach(item => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                    <td>${item.payment_id || '-'}</td>
                    <td>${item.amount || '-'}</td>
                    <td>${item.vat || '-'}</td>
                    <td>${item.payment_method || '-'}</td>
                    <td>${item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : '-'}</td>
                    <td>${item.driver_user?.full_name || '-'}</td>
                    <td>${item.car?.car_plate || '-'}</td>
                    <td>${item.company?.company_name || '-'}</td>
                  `;
                  tbody.appendChild(row);
                });
              }
            })
            .catch(err => {
              alert('حدث خطأ: ' + err.message);
            });
        } else {
          // جميع النتائج ضمن الصفحة الأولى (لا توجد صفحات إضافية)
          allResults = resultsArray;
          countBox.textContent = `إجمالي النتائج: ${totalCount}`;
          if (pageSize && pageSize > 0) {
            currentPage = 1;
            renderPage();
          } else {
            tbody.innerHTML = '';
            resultsArray.forEach(item => {
              const row = document.createElement('tr');
              row.innerHTML = `
                <td>${item.payment_id || '-'}</td>
                <td>${item.amount || '-'}</td>
                <td>${item.vat || '-'}</td>
                <td>${item.payment_method || '-'}</td>
                <td>${item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : '-'}</td>
                <td>${item.driver_user?.full_name || '-'}</td>
                <td>${item.car?.car_plate || '-'}</td>
                <td>${item.company?.company_name || '-'}</td>
              `;
              tbody.appendChild(row);
            });
          }
        }
      } else {
        // في حالة عدم وجود أي نتائج، إظهار رسالة تفيد بذلك
        emptyMsg.style.display = 'block';
      }
    })
    .catch(err => {
      // التعامل مع أي أخطاء أثناء عملية الجلب وإظهار رسالة للمستخدم
      alert('حدث خطأ: ' + err.message);
    });
}

/**
 * دالة لعرض صفحة واحدة من بيانات المدفوعات المخزنة في allResults.
 * تستخدم المتغيرات العالمية currentPage و pageSize لتحديد أي جزء من allResults سيتم عرضه.
 */
function renderPage() {
  if (!pageSize || isNaN(pageSize) || pageSize < 1) {
    alert('من فضلك اختر عدد النتائج أولاً من القائمة الجانبية.');
    return;
  }
  const tbody = document.getElementById('paymentsBody');
  const emptyMsg = document.getElementById('emptyMessage');

  // حساب مؤشر البداية والنهاية للبيانات التي سيتم عرضها في الصفحة الحالية
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = allResults.slice(startIndex, endIndex);

  // تفريغ محتوى الجدول الحالي وإخفاء رسالة "لا توجد بيانات" استعدادًا لعرض الصفحة الجديدة
  tbody.innerHTML = '';
  emptyMsg.style.display = 'none';

  // إذا كانت هناك بيانات لهذه الصفحة، نقوم بإنشاء صفوف الجدول وعرضها
  if (pageData.length > 0) {
    pageData.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.payment_id || '-'}</td>
        <td>${item.amount || '-'}</td>
        <td>${item.vat || '-'}</td>
        <td>${item.payment_method || '-'}</td>
        <td>${item.created_at ? new Date(item.created_at).toLocaleString('ar-EG') : '-'}</td>
        <td>${item.driver_user?.full_name || '-'}</td>
        <td>${item.car?.car_plate || '-'}</td>
        <td>${item.company?.company_name || '-'}</td>
      `;
      tbody.appendChild(row);
    });
  } else {
    // إن لم توجد بيانات في الصفحة الحالية
    emptyMsg.style.display = 'block';
  }
}

// تنفيذ ما يلي بعد تحميل محتوى الصفحة بالكامل لضمان وجود عناصر DOM المطلوبة
document.addEventListener('DOMContentLoaded', () => {
  // الحصول على عنصر اختيار حجم الصفحة وتعبئته بالخيارات المتاحة
  const pageSizeSelect = document.getElementById('pageSizeSelect');
  pageSizeSelect.innerHTML = '';  // تفريغ الخيارات الحالية لضمان بدء القائمة بخيار فارغ
  const sizes = [10, 25, 50, 100, 200, 500];
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'اختر عدد النتائج';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  pageSizeSelect.appendChild(defaultOption);

  sizes.forEach(size => {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = size;
    pageSizeSelect.appendChild(option);
  });

  // 1. زر "فلترة": لجلب البيانات حسب نطاق التاريخ المحدد
  document.getElementById('filterBtn').addEventListener('click', () => {
    const fromDate = document.getElementById('dateFrom').value;
    const toDate = document.getElementById('dateTo').value;
    currentPage = 1;
    loadPayments(fromDate, toDate);
  });

  // 2. زر "تصدير": لتصدير البيانات الحالية المعروضة في الجدول إلى ملف CSV
  document.getElementById('exportBtn').addEventListener('click', () => {
    const table = document.getElementById('paymentsTable');
    let csvContent = '';

    // جمع رؤوس الأعمدة من الجدول
    const headers = table.querySelectorAll('thead th');
    const headerValues = Array.from(headers).map(th => th.innerText);
    csvContent += headerValues.join(',') + '\n';

    // جمع بيانات كل صف من الصفوف الظاهرة في الجدول
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const cellValues = Array.from(cells).map(td => td.innerText);
      csvContent += cellValues.join(',') + '\n';
    });

    // إنشاء ملف Blob لمحتوى CSV مع إضافة BOM في البداية لضمان الترميز
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    // إنشاء رابط مؤقت وتحميل ملف CSV من خلاله
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = 'payments.csv';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  });

  // 3. تغيير حجم الصفحة: عند اختيار حجم مختلف، إعادة ضبط الصفحة الحالية وإعادة العرض
  pageSizeSelect.addEventListener('change', () => {
    const selectedValue = parseInt(pageSizeSelect.value);
    if (!isNaN(selectedValue) && selectedValue > 0) {
      pageSize = selectedValue;
      currentPage = 1;
      renderPage();  // استخدم البيانات المحملة مسبقًا (allResults)
    }
  });

  // 4. زر "الصفحة السابقة": يعرض الصفحة السابقة إن وُجدت
  document.getElementById('prevPage').addEventListener('click', () => {
    if (!pageSize || isNaN(pageSize) || pageSize < 1) {
      alert('من فضلك اختر عدد النتائج أولاً من القائمة الجانبية.');
      return;
    }
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  });

  // 5. زر "الصفحة التالية": يعرض الصفحة التالية إن وُجدت
  document.getElementById('nextPage').addEventListener('click', () => {
    if (!pageSize || isNaN(pageSize) || pageSize < 1) {
      alert('من فضلك اختر عدد النتائج أولاً من القائمة الجانبية.');
      return;
    }
    const totalPages = Math.ceil(allResults.length / pageSize);
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  });

  // زر "المدفوعات اليوم": لجلب بيانات اليوم الحالي فقط
  document.getElementById('ordersBtn').addEventListener('click', () => {
    currentPage = 1;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    loadPayments(today, today);
  });
});