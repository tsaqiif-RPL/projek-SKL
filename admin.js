/* ============================================================
   ADMIN PANEL SEDERHANA
   ============================================================
   Cara kerjanya:
   1. Ada tombol "Edit" di navbar.
   2. Pas diklik, muncul kotak buat masukin PIN.
   3. Kalau PIN-nya benar, semua teks yang punya class="editable"
      jadi bisa langsung diketik ulang (contentEditable).
   4. Setiap kali teksnya diubah, otomatis kesimpen ke localStorage
      (memori bawaan browser) supaya nggak ilang walau di-refresh
      atau browser ditutup.
   5. Pas halaman dibuka lagi, teks yang tersimpan otomatis
      ditampilkan (ganti dari teks default yang ada di HTML).

   CATATAN: localStorage itu cuma tersimpan di BROWSER & DEVICE
   yang kamu pakai buat ngedit. Kalau website ini nanti diupload
   ke internet, orang lain yang buka di device lain TETAP lihat
   teks default dari file HTML, bukan hasil editanmu.
   ============================================================ */

// Ganti angka ini kalau mau ganti PIN admin
const ADMIN_PIN = "1234";

// Prefix biar key di localStorage nggak ketuker sama web lain
const STORAGE_PREFIX = "portofolio_";

// Ambil semua elemen yang bisa diedit (yang punya class "editable")
const editableElements = document.querySelectorAll(".editable");

// Tombol Edit di navbar
const editToggleBtn = document.getElementById("edit-toggle-btn");

// Status: lagi dalam mode edit apa nggak (default: tidak)
let isEditing = false;

/* ------------------------------------------------------------
   FUNGSI CEK PIN (dipakai bareng buat tombol Edit & Tambah Karya)
   Balikin true kalau PIN benar / mode edit udah aktif duluan
   ------------------------------------------------------------ */
function cekPinAdmin() {
  if (isEditing) return true; // udah dalam mode edit, ga perlu tanya lagi

  const inputPin = window.prompt("Masukkan PIN admin:");
  if (inputPin === null) return false; // ditekan Cancel

  if (inputPin !== ADMIN_PIN) {
    alert("PIN salah! Coba lagi.");
    return false;
  }
  return true;
}

/* ------------------------------------------------------------
   1. PAS HALAMAN DIBUKA: tampilkan teks yang sudah pernah
      disimpan sebelumnya (kalau ada) dari localStorage
   ------------------------------------------------------------ */
function muatDataTersimpan() {
  editableElements.forEach((el) => {
    const key = el.dataset.key; // ambil dari atribut data-key="..."
    const savedText = localStorage.getItem(STORAGE_PREFIX + key);

    // Kalau ada data tersimpan buat key ini, timpa teks defaultnya
    if (savedText !== null) {
      el.textContent = savedText;
    }
  });
}

/* ------------------------------------------------------------
   2. NYALAIN / MATIIN MODE EDIT
   ------------------------------------------------------------ */
function toggleModeEdit() {
  if (!isEditing) {
    // ===== Mau MASUK mode edit -> minta PIN dulu =====
    const inputPin = window.prompt("Masukkan PIN admin buat mulai edit:");

    // Kalau ditekan "Cancel" atau dikosongin, batal
    if (inputPin === null) return;

    if (inputPin !== ADMIN_PIN) {
      alert("PIN salah! Coba lagi.");
      return;
    }

    // PIN benar -> aktifkan mode edit
    isEditing = true;
    document.body.classList.add("is-editing");
    editToggleBtn.textContent = "✅ Selesai Edit";

    editableElements.forEach((el) => {
      el.setAttribute("contenteditable", "true");
    });
  } else {
    // ===== Mau KELUAR dari mode edit (nggak perlu PIN lagi) =====
    isEditing = false;
    document.body.classList.remove("is-editing");
    editToggleBtn.textContent = "🔒 Edit";

    editableElements.forEach((el) => {
      el.removeAttribute("contenteditable");
    });
  }
}

/* ------------------------------------------------------------
   3. SETIAP TEKS DIUBAH -> LANGSUNG SIMPAN KE localStorage
   ------------------------------------------------------------ */
editableElements.forEach((el) => {
  // "input" adalah event yang otomatis kejalan tiap kali
  // ada perubahan teks di elemen yang contentEditable
  el.addEventListener("input", () => {
    const key = el.dataset.key;
    localStorage.setItem(STORAGE_PREFIX + key, el.textContent);
  });
});

/* ------------------------------------------------------------
   JALANKAN SEMUANYA
   ------------------------------------------------------------ */
editToggleBtn.addEventListener("click", toggleModeEdit);
muatDataTersimpan(); // langsung dipanggil pas file ini kebaca

/* ================================================================
   4. BAGIAN KARYA-KARYA
   ================================================================
   Karya disimpan sebagai LIST (array) di localStorage, dalam
   bentuk teks JSON. Satu karya = { judul, deskripsi, link }.
   ================================================================ */

const KARYA_KEY = STORAGE_PREFIX + "karya"; // nama key di localStorage

const karyaGrid = document.getElementById("karya-grid");
const karyaEmptyText = document.getElementById("karya-empty");
const karyaAddBtn = document.getElementById("karya-add-btn");

// Ambil daftar karya dari localStorage (kalau belum ada, mulai dari list kosong [])
function ambilDaftarKarya() {
  const data = localStorage.getItem(KARYA_KEY);
  return data ? JSON.parse(data) : [];
}

// Simpan ulang daftar karya (array) ke localStorage
function simpanDaftarKarya(daftarKarya) {
  localStorage.setItem(KARYA_KEY, JSON.stringify(daftarKarya));
}

// Gambar ulang semua kartu karya ke halaman berdasarkan data tersimpan
function renderKarya() {
  const daftarKarya = ambilDaftarKarya();

  // Kosongin dulu grid-nya, biar nggak dobel pas digambar ulang
  karyaGrid.innerHTML = "";

  // Tampil/sembunyiin teks "belum ada karya"
  karyaEmptyText.classList.toggle("hidden", daftarKarya.length > 0);

  daftarKarya.forEach((karya, index) => {
    const card = document.createElement("div");
    card.className = "karya-card";

    // Kalau karya ini punya link, bikin seluruh kartunya bisa diklik
    if (karya.link) {
      card.classList.add("karya-card--clickable"); // buat styling cursor: pointer
      card.addEventListener("click", () => {
        window.open(karya.link, "_blank");
      });
    }

    // Tombol hapus (cuma keliatan pas mode edit, diatur lewat CSS)
    const hapusBtn = document.createElement("button");
    hapusBtn.className = "karya-card__delete";
    hapusBtn.type = "button";
    hapusBtn.textContent = "✕";
    hapusBtn.setAttribute("aria-label", "Hapus karya ini");
    // stopPropagation() = "jangan biarkan klik ini nembus ke kartu di belakangnya"
    // Tanpa ini, klik tombol hapus juga bakal kehitung sebagai klik kartu (buka link)
    hapusBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      hapusKarya(index);
    });

    card.appendChild(hapusBtn);

    // Foto karya, cuma ditampilin kalau ada gambarnya
    if (karya.gambar) {
      const gambarEl = document.createElement("img");
      gambarEl.className = "karya-card__gambar";
      gambarEl.src = karya.gambar; // ini berupa data URL (base64), bukan link biasa
      gambarEl.alt = karya.judul;
      card.appendChild(gambarEl);
    }

    const judul = document.createElement("p");
    judul.className = "karya-card__judul";
    judul.textContent = karya.judul;

    const deskripsi = document.createElement("p");
    deskripsi.className = "karya-card__deskripsi";
    deskripsi.textContent = karya.deskripsi;

    card.appendChild(judul);
    card.appendChild(deskripsi);

    // Teks kecil "Lihat karya" sebagai penanda visual kartunya bisa diklik
    if (karya.link) {
      const linkHint = document.createElement("span");
      linkHint.className = "karya-card__link";
      linkHint.textContent = "Lihat karya →";
      card.appendChild(linkHint);
    }

    karyaGrid.appendChild(card);
  });
}

// Nambah karya baru (minta PIN dulu kalau belum dalam mode edit)
function tambahKarya() {
  if (!cekPinAdmin()) return;

  const mauUploadFoto = window.confirm(
    "Mau upload foto buat karya ini?\n\nOK = pilih foto dari device\nCancel = lewati, tanpa foto"
  );

  if (mauUploadFoto) {
    // Bikin elemen <input type="file"> secara dinamis lewat JS
    // (nggak perlu ditulis manual di HTML)
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*"; // cuma boleh pilih file gambar

    // Event ini kejalan pas user udah milih file dari jendela pilih file
    fileInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (!file) {
        lanjutkanTambahKarya(""); // ga jadi milih file
        return;
      }

      // Batasi ukuran file, misal maksimal 1.5MB, biar localStorage nggak penuh
      const maksimalUkuranMB = 1.5;
      if (file.size > maksimalUkuranMB * 1024 * 1024) {
        alert(
          `Ukuran foto kegedean (maks ${maksimalUkuranMB}MB). Coba kompres/perkecil dulu fotonya ya.`
        );
        return;
      }

      // FileReader = alat bawaan JS buat "membaca" isi file yang dipilih user
      const reader = new FileReader();
      reader.onload = () => {
        // reader.result berisi gambar dalam bentuk teks base64 (data URL),
        // teks ini yang nanti disimpan ke localStorage
        lanjutkanTambahKarya(reader.result);
      };
      reader.readAsDataURL(file);
    });

    fileInput.click(); // otomatis buka jendela pilih file
  } else {
    lanjutkanTambahKarya(""); // lanjut tanpa foto
  }
}

// Lanjutan proses tambah karya, dipanggil setelah foto dipilih (atau dilewati)
function lanjutkanTambahKarya(gambarBase64) {
  const judul = window.prompt("Judul karya:");
  if (!judul) return; // batal kalau kosong/di-cancel

  const deskripsi = window.prompt("Deskripsi singkat karyanya:") || "";
  const link = window.prompt("Link karya (boleh dikosongin kalau nggak ada):") || "";

  const daftarKarya = ambilDaftarKarya();
  daftarKarya.push({ judul, deskripsi, link, gambar: gambarBase64 });
  simpanDaftarKarya(daftarKarya);

  renderKarya();
}

// Hapus karya berdasarkan posisinya di list
function hapusKarya(index) {
  const yakin = window.confirm("Yakin mau hapus karya ini?");
  if (!yakin) return;

  const daftarKarya = ambilDaftarKarya();
  daftarKarya.splice(index, 1); // buang 1 item di posisi 'index'
  simpanDaftarKarya(daftarKarya);

  renderKarya();
}

karyaAddBtn.addEventListener("click", tambahKarya);
renderKarya(); // langsung gambar karya yang udah tersimpan (kalau ada) pas halaman dibuka