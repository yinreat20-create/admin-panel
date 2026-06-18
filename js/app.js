// Firebase v9 Modüler SDK Kurulumu (Sadece Veritabanı ve Giriş İçin)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// === IMGBB API ANAHTARIN (FOTOĞRAFLAR İÇİN) ===
const IMGBB_API_KEY = "b6f5845f545e78a614430a279733ae4c";

// Firebase Kimlik Bilgilerin
const firebaseConfig = {
  apiKey: "AIzaSyDHWz3bkBBshmV5nTDYCRBV6ve1bH-5AIY",
  authDomain: "silopisahibinden.firebaseapp.com",
  projectId: "silopisahibinden",
  storageBucket: "silopisahibinden.firebasestorage.app",
  messagingSenderId: "483281109347",
  appId: "1:483281109347:web:e1a348344d209338b09356",
  measurementId: "G-73EPRFHRSR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function() {
    
    // === 1. GİRİŞ VE MENÜ İŞLEMLERİ ===
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMessage');
            const submitBtn = this.querySelector('button[type="submit"]');
            
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Kontrol Ediliyor...';
            submitBtn.disabled = true;

            try {
                await signInWithEmailAndPassword(auth, email, password);
                window.location.href = 'dashboard.html';
            } catch (error) {
                errorMsg.textContent = 'Hatalı e-posta veya şifre!';
                errorMsg.style.display = 'block';
                submitBtn.innerHTML = 'Giriş Yap';
                submitBtn.disabled = false;
            }
        });
    }

    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => sidebar.classList.toggle('active'));
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await signOut(auth);
            window.location.href = 'index.html';
        });
    }

    // === 2. FOTOĞRAF YÜKLEME VE ÖNİZLEME (BASE64) ===
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
                        
                        // ImgBB için sadece Base64 veri kısmını alıyoruz
                        const base64Verisi = event.target.result.split(',')[1];
                        yuklenenFotograflar.push(base64Verisi);
                    }
                    reader.readAsDataURL(file);
                }
            });
        });
    }

    // === 3. İLAN KAYDETME (IMGBB + FIREBASE FIRESTORE) ===
    const ilanForm = document.getElementById('ilanForm');
    if (ilanForm) {
        ilanForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fotoğraflar Yükleniyor... (Lütfen Bekleyin)';
            submitBtn.disabled = true;
            submitBtn.style.opacity = "0.7";

            try {
                let resimLinkleri = [];
                
                // 1. Önce Fotoğrafları ImgBB'ye Yükle
                if (yuklenenFotograflar.length > 0) {
                    for (let i = 0; i < yuklenenFotograflar.length; i++) {
                        const formData = new FormData();
                        formData.append("image", yuklenenFotograflar[i]);

                        const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                            method: "POST",
                            body: formData
                        });
                        const data = await response.json();
                        
                        if(data.success) {
                            resimLinkleri.push(data.data.url); // ImgBB'nin verdiği kalıcı linki kaydet
                        }
                    }
                } else {
                    resimLinkleri.push('https://via.placeholder.com/150?text=G%C3%B6rsel+Yok');
                }

                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Veritabanına Yazılıyor...';

                // 2. İlan Verisini Firebase'e Kaydet
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
                
                alert('İlan başarıyla eklendi ve yayına alındı!');
                window.location.href = 'ilanlar.html';
                
            } catch (error) {
                console.error("Yükleme Hatası:", error);
                alert("Hata oluştu! " + error.message);
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
                ilanlar.push({ ...doc.data(), docId: doc.id });
            });
            arayuzuGuncelle();
        } catch (error) {
            console.error("İlanlar çekilirken hata:", error);
        }
    }

    function arayuzuGuncelle() {
        const statCards = document.querySelectorAll('.stat-info h3');
        if (statCards.length >= 4) {
            statCards[0].textContent = ilanlar.length;
            statCards[1].textContent = ilanlar.length * 45; 
            statCards[2].textContent = new Set(ilanlar.map(i => i.sahibi)).size;
            statCards[3].textContent = "0";
        }

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
                        <button class="btn-sil" data-docid="${ilan.docId}" style="background: none; border: none; color: var(--primary); cursor: pointer; font-size: 1.1rem;" title="Sil"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        };

        const ilanlarTable = document.getElementById('ilanlarTable'); 
        if (ilanlarTable && ilanlar.length > 0) {
            ilanlarTable.innerHTML = ilanlar.map(ilan => tabloHTML(ilan)).slice(0, 3).join('');
        }

        const tumIlanlarTable = document.getElementById('tumIlanlarTable');
        if (tumIlanlarTable && ilanlar.length > 0) {
            tumIlanlarTable.innerHTML = ilanlar.map(ilan => tabloHTML(ilan)).join('');
        }
    }

    document.addEventListener('click', async function(e) {
        if (e.target.closest('.btn-sil')) {
            if (confirm('DİKKAT: Bu ilan veritabanından kalıcı olarak silinecek. Emin misiniz?')) {
                const btn = e.target.closest('.btn-sil');
                const docId = btn.getAttribute('data-docid');
                try {
                    await deleteDoc(doc(db, "ilanlar", docId));
                    window.location.reload(); 
                } catch (error) {
                    alert("Silinirken hata oluştu: " + error.message);
                }
            }
        }
    });

    verileriGetir();
});
