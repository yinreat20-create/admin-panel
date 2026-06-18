// Firebase v9 Modüler SDK Kurulumu (CDN üzerinden)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Senin Firebase Kimlik Bilgilerin
const firebaseConfig = {
  apiKey: "AIzaSyDHWz3bkBBshmV5nTDYCRBV6ve1bH-5AIY",
  authDomain: "silopisahibinden.firebaseapp.com",
  projectId: "silopisahibinden",
  storageBucket: "silopisahibinden.firebasestorage.app",
  messagingSenderId: "483281109347",
  appId: "1:483281109347:web:e1a348344d209338b09356",
  measurementId: "G-73EPRFHRSR"
};

// Firebase'i Başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

document.addEventListener('DOMContentLoaded', function() {
    
    // === 1. MENÜ VE ÇIKIŞ İŞLEMLERİ ===
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }
    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // === 2. FOTOĞRAF YÜKLEME VE ÖNİZLEME (Base64 Formatı) ===
    const photoInput = document.getElementById('photoInput');
    const previewGrid = document.getElementById('previewGrid');
    let yuklenenFotograflar = []; 

    if (photoInput && previewGrid) {
        photoInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            if (files.length > 20) {
                alert('En fazla 20 adet fotoğraf yükleyebilirsiniz.');
                this.value = ''; return;
            }

            previewGrid.innerHTML = ''; 
            previewGrid.style.display = "flex";
            previewGrid.style.flexWrap = "wrap";
            previewGrid.style.gap = "10px";
            previewGrid.style.marginTop = "15px";
            yuklenenFotograflar = []; 

            if(files.length > 0) {
                const baslik = document.createElement('div');
                baslik.style = "width: 100%; font-weight: 600; color: #16a34a; margin-bottom: 5px; font-size: 0.95rem;";
                baslik.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${files.length} fotoğraf başarıyla seçildi!`;
                previewGrid.appendChild(baslik);
            }

            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        const img = document.createElement('img');
                        img.src = event.target.result;
                        img.style = "width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);";
                        previewGrid.appendChild(img);
                        // Storage'a göndermek üzere Base64 verisini kaydet
                        yuklenenFotograflar.push(event.target.result);
                    }
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    // === 3. FIREBASE'E İLAN KAYDETME SİSTEMİ ===
    const ilanForm = document.getElementById('ilanForm');
    if (ilanForm) {
        ilanForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İlan Buluta Yükleniyor... (Lütfen Bekleyin)';
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";

            try {
                let resimLinkleri = [];
                // 1. Önce Fotoğrafları Firebase Storage'a Yükle
                if (yuklenenFotograflar.length > 0) {
                    for (let i = 0; i < yuklenenFotograflar.length; i++) {
                        const base64Data = yuklenenFotograflar[i];
                        const fotoPath = `ilan-fotograflari/foto_${Date.now()}_${i}.jpg`;
                        const fotoRef = ref(storage, fotoPath);
                        
                        await uploadString(fotoRef, base64Data, 'data_url');
                        const url = await getDownloadURL(fotoRef);
                        resimLinkleri.push(url);
                    }
                } else {
                    resimLinkleri.push('https://via.placeholder.com/150?text=G%C3%B6rsel+Yok');
                }

                // 2. Fotoğraf Linkleriyle Birlikte İlan Verisini Firestore'a Kaydet
                const yeniIlan = {
                    id: Math.floor(100000 + Math.random() * 900000),
                    baslik: document.getElementById('ilanBaslik').value,
                    fiyat: document.getElementById('ilanFiyat').value,
                    kategori: document.getElementById('ilanKategori').value,
                    sahibi: document.getElementById('ilanSahibi').value,
                    telefon: document.getElementById('ilanTelefon').value,
                    gizlilik: document.getElementById('ilanGizlilik').value,
                    aciklama: document.getElementById('ilanAciklama').value,
                    tarih: new Date().toLocaleDateString('tr-TR'),
                    durum: 'Aktif',
                    gorseller: resimLinkleri
                };

                await addDoc(collection(db, "ilanlar"), yeniIlan);
                
                alert('İlan başarıyla Firebase Veritabanına eklendi!');
                window.location.href = 'ilanlar.html';
                
            } catch (error) {
                console.error("Firebase Yükleme Hatası:", error);
                alert("Hata oluştu! Veritabanı okuma/yazma izinlerinizi kontrol edin. Hata kodu: " + error.message);
                submitBtn.innerHTML = 'İlanı Kaydet ve Yayınla';
                submitBtn.disabled = false;
                submitBtn.style.opacity = "1";
            }
        });
    }

    // === 4. FIREBASE'DEN İLANLARI ÇEKME VE LİSTELEME ===
    let ilanlar = [];
    async function verileriGetir() {
        try {
            const querySnapshot = await getDocs(collection(db, "ilanlar"));
            ilanlar = [];
            querySnapshot.forEach((doc) => {
                // Her ilanın özel Firebase ID'sini de (docId) siliş işlemleri için alıyoruz
                ilanlar.push({ ...doc.data(), docId: doc.id });
            });
            
            arayuzuGuncelle();
        } catch (error) {
            console.error("İlanlar çekilirken hata:", error);
        }
    }

    function arayuzuGuncelle() {
        // İstatistikleri Güncelle
        const statCards = document.querySelectorAll('.stat-info h3');
        if (statCards.length >= 4) {
            statCards[0].textContent = ilanlar.length;
            statCards[1].textContent = ilanlar.length * 45; // Görüntülenme (Temsili)
            statCards[2].textContent = new Set(ilanlar.map(i => i.sahibi)).size;
            statCards[3].textContent = "0";
        }

        // Tabloları Doldur
        const tabloHTML = (ilan) => {
            let durumClass = ilan.durum === 'Pasif' ? 'status-passive' : (ilan.durum === 'Beklemede' ? 'status-pending' : 'status-active');
            return `
                <tr>
                    <td><img src="${ilan.gorseller[0]}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"></td>
                    <td><strong>#${ilan.id}</strong> - ${ilan.baslik}</td>
                    <td><span style="color: var(--text-light); font-size: 0.9rem;">${ilan.kategori}</span></td>
                    <td style="font-weight: 600; color: var(--secondary);">${parseFloat(ilan.fiyat).toLocaleString('tr-TR')} ₺</td>
                    <td>${ilan.tarih}</td>
                    <td><span class="badge-status ${durumClass}">${ilan.durum}</span></td>
                    <td>
                        <button class="btn-sil" data-docid="${ilan.docId}" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 1.1rem;" title="Kalıcı Olarak Sil"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        };

        const ilanlarTable = document.getElementById('ilanlarTable'); // Dashboard (Son 3 ilan)
        if (ilanlarTable && ilanlar.length > 0) {
            ilanlarTable.innerHTML = ilanlar.map(ilan => tabloHTML(ilan)).slice(0, 3).join('');
        }

        const tumIlanlarTable = document.getElementById('tumIlanlarTable'); // İlanlar sayfası
        if (tumIlanlarTable && ilanlar.length > 0) {
            tumIlanlarTable.innerHTML = ilanlar.map(ilan => tabloHTML(ilan)).join('');
        }

        // Grafikleri Güncelle (Sadece Dashboard'da varsa)
        if(window.Chart && document.getElementById('donutChart')) {
            // Basit bir sayım animasyonu ekleyebilirsiniz, şimdilik grafikler eski taslaktaki gibi kalsın istiyorsan buraya o kodlar gelebilir.
        }
    }

    // İlan Silme (Firebase'den kalıcı siler)
    document.addEventListener('click', async function(e) {
        if (e.target.closest('.btn-sil')) {
            if (confirm('DİKKAT: Bu ilan Firebase veritabanından kalıcı olarak silinecek. Emin misiniz?')) {
                const btn = e.target.closest('.btn-sil');
                const docId = btn.getAttribute('data-docid');
                
                try {
                    await deleteDoc(doc(db, "ilanlar", docId));
                    window.location.reload(); // Silince sayfayı yenile
                } catch (error) {
                    alert("Silinirken hata oluştu: " + error.message);
                }
            }
        }
    });

    // Sayfa açıldığında verileri Firebase'den çekmeye başla
    verileriGetir();
});
