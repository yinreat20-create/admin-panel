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
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.textContent = 'Hatalı e-posta veya şifre!';
                errorMsg.style.display = 'block';
            }
        });
    }

    // === 2. GENEL SİSTEM AYARLARI ===
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

    // LOCALSTORAGE GEÇİCİ VERİ TABANI ALTYAPISI
    let ilanlar = JSON.parse(localStorage.getItem('ilanlar')) || [];
    let yuklenenFotograflar = [];
    // === 3. ÇOKLU FOTOĞRAF YÜKLEME VE ÖNİZLEME ===
    const photoInput = document.getElementById('photoInput');
    const previewGrid = document.getElementById('previewGrid');

    if (photoInput && previewGrid) {
        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            
            if (files.length > 20) {
                alert('En fazla 20 adet fotoğraf yükleyebilirsiniz.');
                this.value = '';
                return;
            }

            // Eski önizlemeleri temizle ve garantili görünüm için stilleri JavaScript'ten ver
            previewGrid.innerHTML = ''; 
            previewGrid.style.display = "flex";
            previewGrid.style.flexWrap = "wrap";
            previewGrid.style.gap = "10px";
            previewGrid.style.marginTop = "15px";
            yuklenenFotograflar = []; 

            if(files.length > 0) {
                // Yüklendiğine dair yeşil onay yazısı ve ikon
                const baslik = document.createElement('div');
                baslik.style = "width: 100%; font-weight: 600; color: #16a34a; margin-bottom: 5px; font-size: 0.95rem;";
                baslik.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${files.length} fotoğraf başarıyla yüklendi!`;
                previewGrid.appendChild(baslik);
            }

            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        // Fotoğrafı küçük şık bir kare (thumbnail) olarak ekrana bas
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.style = "width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
                        previewGrid.appendChild(img);
                        
                        // Fotoğrafı ilan kayıt dizisine gönder
                        yuklenenFotograflar.push(event.target.result);
                    }
                    reader.readAsDataURL(file);
                }
            });
        });
    }
    

    // === 4. İLAN KAYDETME VE YAYINLAMA SİSTEMİ ===
    const ilanForm = document.getElementById('ilanForm');
    if (ilanForm) {
        ilanForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // Formdaki tüm verileri toplayıp paket haline getiriyoruz
            const yeniIlan = {
                id: Math.floor(100000 + Math.random() * 900000), // Rastgele İlan Numarası
                baslik: document.getElementById('ilanBaslik').value,
                fiyat: document.getElementById('ilanFiyat').value,
                kategori: document.getElementById('ilanKategori').value,
                sahibi: document.getElementById('ilanSahibi').value,
                telefon: document.getElementById('ilanTelefon').value,
                gizlilik: document.getElementById('ilanGizlilik').value,
                aciklama: document.getElementById('ilanAciklama').value,
                tarih: new Date().toLocaleDateString('tr-TR'),
                durum: 'Aktif',
                gorseller: yuklenenFotograflar.length > 0 ? yuklenenFotograflar : ['https://via.placeholder.com/150?text=G%C3%B6rsel+Yok']
            };

            // Paketi veri tabanına (tarayıcıya) fırlat
            ilanlar.push(yeniIlan);
            localStorage.setItem('ilanlar', JSON.stringify(ilanlar));

            alert('İlan başarıyla kaydedildi ve listenize eklendi!');
            window.location.href = 'ilanlar.html'; // İlanların olduğu listeye uçur
        });
    }

    // === 5. VERİLERİ PANELDE GÖSTERME (DİNAMİK DAMARLAR) ===
    function istatistikleriGuncelle() {
        const statCards = document.querySelectorAll('.stat-info h3');
        if (statCards.length >= 4) {
            statCards[0].textContent = ilanlar.length; // Toplam İlan Sayısı
            
            // Simüle edilmiş toplam izlenme sayısı
            let toplamIzlenme = ilanlar.length * 27; 
            statCards[1].textContent = toplamIzlenme;
            
            // Kaç farklı kullanıcı ilan eklediyse say
            let benzersizKullanicilar = new Set(ilanlar.map(i => i.sahibi)).size;
            statCards[2].textContent = benzersizKullanicilar;
            
            statCards[3].textContent = "0"; // Bekleyen Mesaj
        }
    }

        // HTML Tablo Satırı Oluşturucu Şablon (Kalem butonu eklendi)
    function tabloSatiriOlustur(ilan) {
        let durumClass = 'status-active';
        if (ilan.durum === 'Pasif') durumClass = 'status-passive';
        if (ilan.durum === 'Beklemede') durumClass = 'status-pending';

        return `
            <tr>
                <td><img src="${ilan.gorseller[0]}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"></td>
                <td><strong>#${ilan.id}</strong> - ${ilan.baslik}</td>
                <td><span style="color: var(--text-light); font-size: 0.9rem;">${ilan.kategori}</span></td>
                <td style="font-weight: 600; color: var(--secondary);">${parseFloat(ilan.fiyat).toLocaleString('tr-TR')} ₺</td>
                <td>${ilan.tarih}</td>
                <td><span class="badge-status ${durumClass}">${ilan.durum}</span></td>
                <td>
                    <button class="btn-duzenle" data-id="${ilan.id}" style="background: none; border: none; color: #0284c7; cursor: pointer; font-size: 1.1rem; margin-right: 12px;" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
                    
                    <button class="btn-sil" data-id="${ilan.id}" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 1.1rem;" title="Sil"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    }

    // Dashboard Ana Sayfa Tablosu (Son Eklenen 3 İlanı Göster)
    const ilanlarTable = document.getElementById('ilanlarTable');
    if (ilanlarTable && ilanlar.length > 0) {
        ilanlarTable.innerHTML = '';
        const sonIlanlar = [...ilanlar].reverse().slice(0, 3);
        sonIlanlar.forEach(ilan => {
            ilanlarTable.innerHTML += tabloSatiriOlustur(ilan);
        });
    }

    // Tüm İlanlar Sayfası Tablosu (Fiziksel Olarak Eklediğin Tüm İlanlar)
    const tumIlanlarTable = document.getElementById('tumIlanlarTable');
    if (tumIlanlarTable && ilanlar.length > 0) {
        tumIlanlarTable.innerHTML = '';
        [...ilanlar].reverse().forEach(ilan => {
            tumIlanlarTable.innerHTML += tabloSatiriOlustur(ilan);
        });
    }

    // İlan Silme Tetikleyicisi
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-sil')) {
            if (confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
                const id = e.target.closest('.btn-sil').getAttribute('data-id');
                ilanlar = ilanlar.filter(ilan => ilan.id != id);
                localStorage.setItem('ilanlar', JSON.stringify(ilanlar));
                window.location.reload();
            }
        }
    });

    // İstatistik rakamlarını açılışta güncelle
    istatistikleriGuncelle();

    // === 6. GRAFİKLERİ GERÇEK VERİYE BAĞLAMA ===
    const lineCtx = document.getElementById('lineChart');
    const donutCtx = document.getElementById('donutChart');

    if (lineCtx && donutCtx) {
        let aktifSayisi = ilanlar.filter(i => i.durum === 'Aktif').length;
        let pasifSayisi = ilanlar.filter(i => i.durum === 'Pasif').length;
        let beklemeSayisi = ilanlar.filter(i => i.durum === 'Beklemede').length;

        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
                datasets: [{
                    label: 'İlan Akışı',
                    data: [ilanlar.length, 0, 0, 0, 0, 0, 0],
                    borderColor: '#ef233c',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(239, 35, 60, 0.1)'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        new Chart(donutCtx, {
            type: 'doughnut',
            data: {
                labels: ['Aktif', 'Pasif', 'Beklemede'],
                datasets: [{
                    data: [aktifSayisi, pasifSayisi, beklemeSayisi],
                    backgroundColor: ['#16a34a', '#ea580c', '#64748b'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '75%' }
        });
    }
});
    
