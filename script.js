/* ==========================================================
   KASIR TOKO PERLENGKAPAN BAYI (PEMBAYARAN TUNAI SAJA)
   Data disimpan di localStorage (produk & riwayat transaksi)
   ========================================================== */

const KEY_PRODUK = "kasirBayi_produk";
const KEY_TRX = "kasirBayi_transaksi";
const NAMA_TOKO = "Baby Kasir";
const METODE_BAYAR = "Tunai"; // hanya tunai

const PRODUK_AWAL = [
  { id: 1,  nama: "Baju Bayi Newborn (3 pcs)", kategori: "Pakaian", harga: 85000, stok: 25 },
  { id: 2,  nama: "Jumper Bayi Katun", kategori: "Pakaian", harga: 65000, stok: 20 },
  { id: 3,  nama: "Topi & Sarung Tangan Set", kategori: "Pakaian", harga: 35000, stok: 30 },
  { id: 4,  nama: "Popok Bayi Size M (isi 40)", kategori: "Popok", harga: 95000, stok: 40 },
  { id: 5,  nama: "Popok Bayi Size L (isi 36)", kategori: "Popok", harga: 98000, stok: 35 },
  { id: 6,  nama: "Susu Formula 0-6 Bulan 400g", kategori: "Susu & Makanan", harga: 135000, stok: 18 },
  { id: 7,  nama: "Bubur Bayi Instan 120g", kategori: "Susu & Makanan", harga: 22000, stok: 50 },
  { id: 8,  nama: "Sabun Mandi Bayi 200ml", kategori: "Mandi & Perawatan", harga: 38000, stok: 30 },
  { id: 9,  nama: "Minyak Telon 60ml", kategori: "Mandi & Perawatan", harga: 24000, stok: 45 },
  { id: 10, nama: "Bedak Bayi 100g", kategori: "Mandi & Perawatan", harga: 20000, stok: 40 },
  { id: 11, nama: "Botol Susu 240ml", kategori: "Botol & Dot", harga: 55000, stok: 22 },
  { id: 12, nama: "Dot Silikon (isi 2)", kategori: "Botol & Dot", harga: 28000, stok: 35 },
  { id: 13, nama: "Selimut Bayi Lembut", kategori: "Perlengkapan Tidur", harga: 75000, stok: 15 },
  { id: 14, nama: "Bantal Guling Bayi", kategori: "Perlengkapan Tidur", harga: 60000, stok: 12 },
  { id: 15, nama: "Rattle Mainan Bayi", kategori: "Mainan", harga: 30000, stok: 28 },
  { id: 16, nama: "Boneka Beruang Mini", kategori: "Mainan", harga: 48000, stok: 14 },
];

/* ---------- STATE ---------- */
let produk = [];
let transaksi = [];
let keranjang = []; // { id, qty }
let kategoriAktif = "Semua";
let trxTerakhir = null;

/* ---------- ELEMEN ---------- */
const $ = (id) => document.getElementById(id);

const elCari = $("cari");
const elKategori = $("kategori");
const elProduk = $("daftarProduk");
const elKeranjang = $("isiKeranjang");
const elDiskon = $("diskon");

/* ---------- UTIL ---------- */
const rupiah = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function toast(pesan) {
  $("toastPesan").textContent = pesan;
  bootstrap.Toast.getOrCreateInstance($("toast"), { delay: 2000 }).show();
}

function modal(id) {
  return bootstrap.Modal.getOrCreateInstance($(id));
}

/* ---------- PENYIMPANAN ---------- */
function muatData() {
  let tersimpan = null;
  try {
    tersimpan = JSON.parse(localStorage.getItem(KEY_PRODUK));
    transaksi = JSON.parse(localStorage.getItem(KEY_TRX)) || [];
  } catch (e) {
    tersimpan = null;
    transaksi = [];
  }

  // Ambil hanya field teks/angka, buang ikon & field lain
  const bersih = Array.isArray(tersimpan)
    ? tersimpan
        .filter((p) => p && typeof p.nama === "string" && p.nama.trim() !== "")
        .map((p, i) => ({
          id: Number(p.id) || i + 1,
          nama: p.nama,
          kategori: p.kategori || "Lainnya",
          harga: Number(p.harga) || 0,
          stok: Number(p.stok) || 0,
        }))
    : [];

  // Kalau tidak ada data valid, pakai produk awal
  produk = bersih.length ? bersih : JSON.parse(JSON.stringify(PRODUK_AWAL));
  simpanData();
}

function simpanData() {
  localStorage.setItem(KEY_PRODUK, JSON.stringify(produk));
  localStorage.setItem(KEY_TRX, JSON.stringify(transaksi));
}

/* ---------- KATEGORI & PRODUK ---------- */
function renderKategori() {
  const daftar = ["Semua", ...new Set(produk.map((p) => p.kategori))];
  elKategori.innerHTML = daftar
    .map(
      (k) =>
        `<button class="chip ${k === kategoriAktif ? "active" : ""}" data-kat="${esc(k)}">${esc(k)}</button>`
    )
    .join("");
}

function renderProduk() {
  const kata = elCari.value.trim().toLowerCase();
  const hasil = produk.filter(
    (p) =>
      (kategoriAktif === "Semua" || p.kategori === kategoriAktif) &&
      p.nama.toLowerCase().includes(kata)
  );

  if (!hasil.length) {
    elProduk.innerHTML = `<div class="col-12 text-center text-muted py-5">Produk tidak ditemukan.</div>`;
    return;
  }

  elProduk.innerHTML = hasil
    .map((p) => {
      const habis = p.stok <= 0;
      return `
      <div class="col-6 col-md-4 col-xl-3">
        <div class="card produk-card shadow-sm h-100 ${habis ? "habis" : ""}" data-id="${p.id}">
          <div class="card-body text-center">
            <div class="produk-nama">${esc(p.nama)}</div>
            <div class="text-baby fw-bold">${rupiah(p.harga)}</div>
            <span class="badge ${habis ? "text-bg-danger" : p.stok <= 5 ? "text-bg-warning" : "text-bg-light border"}">
              ${habis ? "Stok habis" : "Stok: " + p.stok}
            </span>
          </div>
        </div>
      </div>`;
    })
    .join("");
}

/* ---------- KERANJANG ---------- */
function cariProduk(id) {
  return produk.find((p) => p.id === id);
}

function tambahKeKeranjang(id) {
  const p = cariProduk(id);
  if (!p || p.stok <= 0) return toast("Stok produk habis");

  const item = keranjang.find((i) => i.id === id);
  if (item) {
    if (item.qty >= p.stok) return toast("Jumlah melebihi stok tersedia");
    item.qty++;
  } else {
    keranjang.push({ id, qty: 1 });
  }
  renderKeranjang();
}

function ubahQty(id, delta) {
  const item = keranjang.find((i) => i.id === id);
  const p = cariProduk(id);
  if (!item || !p) return;

  const baru = item.qty + delta;
  if (baru > p.stok) return toast("Jumlah melebihi stok tersedia");
  if (baru <= 0) return hapusItem(id);
  item.qty = baru;
  renderKeranjang();
}

function hapusItem(id) {
  keranjang = keranjang.filter((i) => i.id !== id);
  renderKeranjang();
}

function hitungTotal() {
  const subtotal = keranjang.reduce((s, i) => s + cariProduk(i.id).harga * i.qty, 0);
  let persen = parseFloat(elDiskon.value) || 0;
  persen = Math.min(Math.max(persen, 0), 100);
  const potongan = subtotal * (persen / 100);
  return { subtotal, persen, potongan, total: subtotal - potongan };
}

function renderKeranjang() {
  if (!keranjang.length) {
    elKeranjang.innerHTML = `
      <div class="text-center text-muted py-5">
        <i class="bi bi-cart-x fs-1"></i>
        <div>Keranjang masih kosong</div>
      </div>`;
  } else {
    elKeranjang.innerHTML = keranjang
      .map((i) => {
        const p = cariProduk(i.id);
        return `
        <div class="cart-item">
          <div class="d-flex justify-content-between">
            <div class="fw-semibold small">${esc(p.nama)}</div>
            <button class="btn btn-sm text-danger p-0" data-hapus="${p.id}"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <small class="text-muted">${rupiah(p.harga)}</small>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-outline-secondary btn-sm qty-btn" data-min="${p.id}">−</button>
              <span class="fw-bold">${i.qty}</span>
              <button class="btn btn-outline-secondary btn-sm qty-btn" data-plus="${p.id}">+</button>
            </div>
            <strong>${rupiah(p.harga * i.qty)}</strong>
          </div>
        </div>`;
      })
      .join("");
  }

  const t = hitungTotal();
  $("subtotal").textContent = rupiah(t.subtotal);
  $("potongan").textContent = "- " + rupiah(t.potongan);
  $("total").textContent = rupiah(t.total);
}

/* ---------- PEMBAYARAN (TUNAI) ---------- */
function bukaPembayaran() {
  if (!keranjang.length) return toast("Keranjang masih kosong");

  const { total } = hitungTotal();
  $("bayarTotal").textContent = rupiah(total);
  $("uangDiterima").value = "";
  $("pesanBayar").textContent = "";

  const pilihan = [total, 50000, 100000, 200000].filter((v, i) => i === 0 || v >= total);
  $("uangCepat").innerHTML = [...new Set(pilihan)]
    .map(
      (v, i) =>
        `<button type="button" class="btn btn-outline-secondary btn-sm" data-uang="${Math.round(v)}">${
          i === 0 ? "Uang Pas" : rupiah(v)
        }</button>`
    )
    .join("");

  hitungKembalian();
  modal("modalBayar").show();
}

function hitungKembalian() {
  const { total } = hitungTotal();
  const bayar = parseFloat($("uangDiterima").value) || 0;
  const kembali = bayar - total;
  $("kembalian").textContent = kembali >= 0 ? rupiah(kembali) : "Rp 0";
}

function prosesPembayaran() {
  const t = hitungTotal();
  const bayar = parseFloat($("uangDiterima").value) || 0;

  if (bayar < t.total) {
    $("pesanBayar").textContent = "Uang yang diterima kurang dari total tagihan.";
    return;
  }

  // Susun transaksi
  const items = keranjang.map((i) => {
    const p = cariProduk(i.id);
    return { id: p.id, nama: p.nama, harga: p.harga, qty: i.qty };
  });

  const trx = {
    no: "TRX-" + Date.now().toString().slice(-8),
    waktu: new Date().toISOString(),
    items,
    subtotal: t.subtotal,
    persenDiskon: t.persen,
    potongan: t.potongan,
    total: t.total,
    bayar,
    kembali: bayar - t.total,
    metode: METODE_BAYAR,
  };

  // Kurangi stok
  keranjang.forEach((i) => {
    cariProduk(i.id).stok -= i.qty;
  });

  transaksi.unshift(trx);
  simpanData();

  // Reset kasir
  keranjang = [];
  elDiskon.value = 0;
  renderKeranjang();
  renderProduk();

  modal("modalBayar").hide();
  tampilkanStruk(trx);
  toast("Transaksi berhasil disimpan");
}

/* ---------- STRUK ---------- */
function tampilkanStruk(trx) {
  trxTerakhir = trx;
  const waktu = new Date(trx.waktu).toLocaleString("id-ID");

  const baris = trx.items
    .map(
      (i) => `
      <div>${esc(i.nama)}</div>
      <div class="baris"><span>${i.qty} x ${rupiah(i.harga)}</span><span>${rupiah(i.qty * i.harga)}</span></div>`
    )
    .join("");

  $("struk").innerHTML = `
    <div class="text-center">
      <strong>${NAMA_TOKO}</strong><br>
      Perlengkapan Bayi &amp; Anak<br>
      <small>${waktu}</small><br>
      <small>${trx.no}</small>
    </div>
    <div class="garis"></div>
    ${baris}
    <div class="garis"></div>
    <div class="baris"><span>Subtotal</span><span>${rupiah(trx.subtotal)}</span></div>
    ${
      trx.potongan > 0
        ? `<div class="baris"><span>Diskon ${trx.persenDiskon}%</span><span>- ${rupiah(trx.potongan)}</span></div>`
        : ""
    }
    <div class="baris"><strong>TOTAL</strong><strong>${rupiah(trx.total)}</strong></div>
    <div class="baris"><span>Bayar (${esc(trx.metode || METODE_BAYAR)})</span><span>${rupiah(trx.bayar)}</span></div>
    <div class="baris"><span>Kembali</span><span>${rupiah(trx.kembali)}</span></div>
    <div class="garis"></div>
    <div class="text-center">Terima kasih sudah berbelanja!<br>Semoga si kecil sehat selalu</div>
  `;
  modal("modalStruk").show();
}

/* ---------- PDF STRUK ---------- */
function unduhPdf() {
  if (!trxTerakhir) return;
  if (!window.jspdf) return toast("Library PDF belum termuat. Periksa koneksi internet.");

  const t = trxTerakhir;
  const { jsPDF } = window.jspdf;
  const lebar = 80;
  const margin = 5;
  const tinggiBaris = 4.6;
  const area = lebar - margin * 2;
  const angka = (n) => Math.round(n).toLocaleString("id-ID");
  const waktu = new Date(t.waktu).toLocaleString("id-ID");

  // Dokumen sementara untuk mengukur lebar teks
  const ukur = new jsPDF({ unit: "mm", format: [lebar, 500] });
  ukur.setFont("courier", "normal");
  ukur.setFontSize(9);

  const ops = [];
  const tengah = (teks, tebal) => ops.push({ jenis: "tengah", teks, tebal });
  const garis = () => ops.push({ jenis: "garis" });
  const kiriKanan = (kiri, kanan, tebal) => ops.push({ jenis: "kk", kiri, kanan, tebal });
  const teksKiri = (teks) =>
    ukur.splitTextToSize(teks, area).forEach((baris) => ops.push({ jenis: "kiri", teks: baris }));

  tengah(NAMA_TOKO, true);
  tengah("Perlengkapan Bayi & Anak");
  tengah(waktu);
  tengah(t.no);
  garis();
  t.items.forEach((i) => {
    teksKiri(i.nama);
    kiriKanan(i.qty + " x " + angka(i.harga), angka(i.qty * i.harga));
  });
  garis();
  kiriKanan("Subtotal", angka(t.subtotal));
  if (t.potongan > 0) kiriKanan("Diskon " + t.persenDiskon + "%", "- " + angka(t.potongan));
  kiriKanan("TOTAL", angka(t.total), true);
  kiriKanan("Bayar (" + (t.metode || METODE_BAYAR) + ")", angka(t.bayar));
  kiriKanan("Kembali", angka(t.kembali));
  garis();
  tengah("Terima kasih sudah berbelanja!");
  tengah("Semoga si kecil sehat selalu");

  const tinggi = margin * 2 + ops.length * tinggiBaris;
  const doc = new jsPDF({ unit: "mm", format: [lebar, tinggi] });
  doc.setFontSize(9);

  let y = margin + 3;
  ops.forEach((o) => {
    doc.setFont("courier", o.tebal ? "bold" : "normal");
    if (o.jenis === "tengah") {
      doc.text(o.teks, lebar / 2, y, { align: "center" });
    } else if (o.jenis === "kiri") {
      doc.text(o.teks, margin, y);
    } else if (o.jenis === "kk") {
      doc.text(o.kiri, margin, y);
      doc.text(o.kanan, lebar - margin, y, { align: "right" });
    } else {
      doc.setLineDashPattern([1, 1], 0);
      doc.line(margin, y - 1.5, lebar - margin, y - 1.5);
      doc.setLineDashPattern([], 0);
    }
    y += tinggiBaris;
  });

  doc.save("struk-" + t.no + ".pdf");
}

/* ---------- RIWAYAT ---------- */
function renderRiwayat() {
  const totalJual = transaksi.reduce((s, t) => s + t.total, 0);
  $("totalPenjualan").textContent = rupiah(totalJual);
  $("jumlahTrx").textContent = transaksi.length;

  if (!transaksi.length) {
    $("tabelRiwayat").innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">Belum ada transaksi.</td></tr>`;
    return;
  }

  $("tabelRiwayat").innerHTML = transaksi
    .map(
      (t, idx) => `
      <tr>
        <td>${esc(t.no)}</td>
        <td>${new Date(t.waktu).toLocaleString("id-ID")}</td>
        <td class="text-end">${rupiah(t.total)}</td>
        <td class="text-end"><button class="btn btn-outline-secondary btn-sm" data-struk="${idx}"><i class="bi bi-receipt"></i></button></td>
      </tr>`
    )
    .join("");
}

/* ---------- TAMBAH PRODUK ---------- */
function simpanProdukBaru(e) {
  e.preventDefault();
  const baru = {
    id: produk.reduce((m, p) => Math.max(m, p.id), 0) + 1,
    nama: $("pNama").value.trim(),
    kategori: $("pKategori").value,
    harga: parseFloat($("pHarga").value) || 0,
    stok: parseInt($("pStok").value) || 0,
  };
  if (!baru.nama) return;

  produk.push(baru);
  simpanData();
  renderKategori();
  renderProduk();
  $("formProduk").reset();
  modal("modalProduk").hide();
  toast("Produk ditambahkan");
}

/* ---------- EVENT ---------- */
elCari.addEventListener("input", renderProduk);

elKategori.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-kat]");
  if (!btn) return;
  kategoriAktif = btn.dataset.kat;
  renderKategori();
  renderProduk();
});

elProduk.addEventListener("click", (e) => {
  const kartu = e.target.closest("[data-id]");
  if (kartu) tambahKeKeranjang(parseInt(kartu.dataset.id));
});

elKeranjang.addEventListener("click", (e) => {
  const plus = e.target.closest("[data-plus]");
  const min = e.target.closest("[data-min]");
  const hapus = e.target.closest("[data-hapus]");
  if (plus) ubahQty(parseInt(plus.dataset.plus), 1);
  else if (min) ubahQty(parseInt(min.dataset.min), -1);
  else if (hapus) hapusItem(parseInt(hapus.dataset.hapus));
});

elDiskon.addEventListener("input", renderKeranjang);

$("btnKosongkan").addEventListener("click", () => {
  if (keranjang.length && confirm("Kosongkan keranjang?")) {
    keranjang = [];
    renderKeranjang();
  }
});

$("btnBayar").addEventListener("click", bukaPembayaran);
$("uangDiterima").addEventListener("input", hitungKembalian);

// Otomatis fokus ke input uang saat modal pembayaran terbuka
$("modalBayar").addEventListener("shown.bs.modal", () => $("uangDiterima").focus());

$("uangCepat").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-uang]");
  if (!btn) return;
  $("uangDiterima").value = btn.dataset.uang;
  hitungKembalian();
});

$("btnProses").addEventListener("click", prosesPembayaran);
$("btnCetak").addEventListener("click", () => window.print());
$("btnPdf").addEventListener("click", unduhPdf);

$("btnRiwayat").addEventListener("click", () => {
  renderRiwayat();
  modal("modalRiwayat").show();
});

$("tabelRiwayat").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-struk]");
  if (!btn) return;
  modal("modalRiwayat").hide();
  tampilkanStruk(transaksi[parseInt(btn.dataset.struk)]);
});

$("btnResetData").addEventListener("click", () => {
  if (!confirm("Hapus semua riwayat dan kembalikan produk/stok ke awal?")) return;
  localStorage.removeItem(KEY_PRODUK);
  localStorage.removeItem(KEY_TRX);
  keranjang = [];
  kategoriAktif = "Semua";
  muatData();
  renderKategori();
  renderProduk();
  renderKeranjang();
  renderRiwayat();
  toast("Data direset");
});

$("formProduk").addEventListener("submit", simpanProdukBaru);

/* ---------- MULAI ---------- */
muatData();
renderKategori();
renderProduk();
renderKeranjang();