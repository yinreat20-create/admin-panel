document.addEventListener('DOMContentLoaded', function() {
    
    // === 1. GİRİŞ İŞLEMİ (LOGIN) ===
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMessage');

            if (email === 'admin@admin.com' && password === '123456') {
                // Giriş başarılı, dashboarda yönlendir
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.textContent = 'Hatalı e-posta veya şifre!';
                errorMsg.style.display = 'block';
            }
        });
    }

    // === 2. DASHBOARD İŞLEMLERİ ===
    // Mobil Menü Aç/Kapat
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Çıkış Yap
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // === 3. CHARTS.JS GRAFİKLERİ (Sadece Dashboard'da çalışır) ===
    const lineCtx = document.getElementById('lineChart');
    const donutCtx = document.getElementById('donutChart');

    if (lineCtx && donutCtx) {
        // İlan Görüntülenme Grafiği
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
                datasets: [{
                    label: 'Görüntülenme',
                    data: [0, 0, 0, 0, 0, 0, 0], // Başlangıçta 0
                    borderColor: '#ef233c', // Kurumsal Kırmızı
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(239, 35, 60, 0.1)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Durum Dağılımı Grafiği
        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Aktif', 'Pasif', 'Beklemede'],
                datasets: [{
                    data: [0, 0, 0], // Başlangıçta 0
                    backgroundColor: ['#16a34a', '#ea580c', '#64748b'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%' }
        });
    }

    // === 4. ÇOKLU FOTOĞRAF YÜKLEME VE ÖNİZLEME (İlan Ekle Sayfası İçin) ===
    // HTML'de <input type="file" id="photoInput" multiple accept="image/*"> oluşturduğunda bu kod otomatik çalışır.
    const photoInput = document.getElementById('photoInput');
    const previewGrid = document.getElementById('previewGrid'); // Fotoğrafların görüneceği div

    if (photoInput && previewGrid) {
        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            
            // Limit kontrolü (En fazla 20)
            if (files.length > 20) {
                alert('En fazla 20 adet fotoğraf yükleyebilirsiniz.');
                this.value = ''; // Seçimi sıfırla
                return;
            }

            previewGrid.innerHTML = ''; // Eski önizlemeleri temizle

            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.className = 'preview-item';
                        previewGrid.appendChild(img);
                    }
                    reader.readAsDataURL(file);
                }
            });
        });
    }
});
