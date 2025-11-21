const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = 'http://127.0.0.1:5001/api';
let authToken = '';

// Data untuk generate dokumen random
const masterDocuments = [
  { title: 'Laporan Keuangan Tahunan 2024', location: 'Jakarta Pusat, DKI Jakarta', description: 'Dokumen lengkap laporan keuangan perusahaan tahun fiskal 2024 mencakup neraca, laba rugi, arus kas, dan catatan atas laporan keuangan beserta analisis mendalam.' },
  { title: 'Kontrak Kerja Sama Vendor', location: 'Surabaya, Jawa Timur', description: 'Perjanjian kerjasama dengan vendor penyedia jasa IT untuk periode 2024-2026, termasuk SLA, term of payment, dan klausul perpanjangan kontrak.' },
  { title: 'Standar Operasional Prosedur HR', location: 'Bandung, Jawa Barat', description: 'Dokumen SOP lengkap departemen Human Resources meliputi rekrutmen, training, payroll, performance appraisal, dan employee relations yang telah direvisi tahun 2024.' },
  { title: 'Rencana Strategis Perusahaan 2025-2030', location: 'Yogyakarta, DIY', description: 'Dokumen perencanaan strategis jangka panjang perusahaan yang mencakup visi misi baru, target growth, ekspansi market, dan roadmap transformasi digital.' },
  { title: 'Audit Internal Q4 2024', location: 'Semarang, Jawa Tengah', description: 'Hasil audit internal kuartal keempat tahun 2024 mencakup review compliance, financial controls, operational efficiency, dan risk management assessment.' },
  { title: 'Proposal Pengembangan Produk Baru', location: 'Bali, Denpasar', description: 'Dokumen proposal pengembangan lini produk baru untuk segmen millennial dengan analisis market research, competitive analysis, pricing strategy, dan projected revenue.' },
  { title: 'Panduan Keamanan Informasi', location: 'Malang, Jawa Timur', description: 'Kebijakan dan prosedur keamanan informasi perusahaan termasuk password policy, data classification, access control, incident response, dan disaster recovery plan.' },
  { title: 'Laporan CSR 2024', location: 'Medan, Sumatera Utara', description: 'Dokumentasi lengkap program Corporate Social Responsibility tahun 2024 meliputi program pendidikan, lingkungan, kesehatan masyarakat, dan pemberdayaan UMKM lokal.' },
  { title: 'Sistem Manajemen Mutu ISO 9001', location: 'Makassar, Sulawesi Selatan', description: 'Dokumentasi sistem manajemen mutu berstandar ISO 9001:2015 mencakup quality policy, objectives, procedures, work instructions, dan records management.' },
  { title: 'Kontrak Sewa Kantor Cabang', location: 'Palembang, Sumatera Selatan', description: 'Perjanjian sewa kantor cabang regional untuk periode 5 tahun dengan klausul perpanjangan, maintenance responsibility, dan early termination terms.' },
  { title: 'Manual Penggunaan Sistem ERP', location: 'Balikpapan, Kalimantan Timur', description: 'Panduan lengkap penggunaan sistem Enterprise Resource Planning untuk semua modul: Finance, HR, Procurement, Inventory, Sales, dan Production Planning.' },
  { title: 'Kebijakan Perlindungan Data Pribadi', location: 'Manado, Sulawesi Utara', description: 'Dokumen kebijakan perlindungan data pribadi sesuai UU PDP mencakup prinsip pemrosesan data, hak subjek data, data retention, dan mekanisme pengaduan.' },
  { title: 'Rencana Kontinuitas Bisnis', location: 'Pontianak, Kalimantan Barat', description: 'Business Continuity Plan komprehensif untuk menghadapi berbagai skenario disaster termasuk pandemic, natural disaster, cyber attack, dan supply chain disruption.' },
  { title: 'Laporan Tahunan Dewan Komisaris', location: 'Batam, Kepulauan Riau', description: 'Annual report dari dewan komisaris yang berisi pengawasan terhadap direksi, evaluasi kinerja perusahaan, rekomendasi strategis, dan good corporate governance.' },
  { title: 'Prosedur Pengadaan Barang dan Jasa', location: 'Banjarmasin, Kalimantan Selatan', description: 'SOP procurement mencakup vendor selection, tender process, purchase approval workflow, goods receipt, invoice verification, dan payment processing.' },
  { title: 'Analisis Risiko Operasional', location: 'Pekanbaru, Riau', description: 'Comprehensive risk assessment dokumen yang mengidentifikasi, menganalisis, dan memitigasi berbagai risiko operasional bisnis termasuk risk register dan treatment plan.' },
  { title: 'Pedoman Tata Kelola Perusahaan', location: 'Jambi, Jambi', description: 'Corporate governance manual yang mengatur struktur organisasi, wewenang pengambilan keputusan, board committees, related party transactions, dan code of conduct.' },
  { title: 'Spesifikasi Teknis Infrastruktur IT', location: 'Bengkulu, Bengkulu', description: 'Dokumentasi teknis lengkap infrastruktur IT perusahaan meliputi network topology, server specifications, security architecture, dan backup configuration.' },
  { title: 'Program Pelatihan Karyawan 2025', location: 'Lampung, Bandar Lampung', description: 'Rencana program training and development karyawan tahun 2025 mencakup technical training, soft skills, leadership development, dan certification programs.' },
  { title: 'Evaluasi Kinerja Supplier', location: 'Mataram, Nusa Tenggara Barat', description: 'Laporan evaluasi performa vendor dan supplier berdasarkan kriteria quality, delivery, price, service, dan compliance terhadap kontrak dan standar perusahaan.' },
  { title: 'Strategi Digital Marketing 2025', location: 'Kupang, Nusa Tenggara Timur', description: 'Blueprint strategi pemasaran digital yang mencakup social media strategy, content marketing, SEO/SEM, email marketing, influencer partnership, dan marketing automation.' },
  { title: 'Laporan Inventarisasi Aset', location: 'Ambon, Maluku', description: 'Dokumentasi lengkap seluruh aset perusahaan termasuk fixed assets, current assets, intangible assets, dengan detail lokasi, nilai perolehan, akumulasi penyusutan, dan kondisi.' },
  { title: 'Kebijakan Anti Korupsi', location: 'Jayapura, Papua', description: 'Anti-corruption policy yang mencakup gift and entertainment guidelines, conflict of interest management, whistleblowing mechanism, dan investigation procedures.' },
  { title: 'Rencana Pengembangan SDM', location: 'Ternate, Maluku Utara', description: 'Strategic human capital development plan mencakup succession planning, talent acquisition strategy, retention programs, compensation & benefits review, dan organization development.' },
  { title: 'Dokumentasi Proyek Transformasi Digital', location: 'Sorong, Papua Barat', description: 'Project documentation transformasi digital perusahaan meliputi current state assessment, target operating model, roadmap implementation, change management, dan expected benefits realization.' }
];

const subDocumentTemplates = [
  { suffix: 'Lampiran A', desc: 'Lampiran berisi data pendukung, tabel analisis, grafik perbandingan, dan dokumentasi foto kegiatan.' },
  { suffix: 'Lampiran B', desc: 'Dokumen pendukung berupa surat pernyataan, bukti transaksi, invoice, dan dokumen legal terkait.' },
  { suffix: 'Revisi 1', desc: 'Revisi pertama dokumen dengan perbaikan pada bagian analisis data dan rekomendasi strategis.' },
  { suffix: 'Addendum', desc: 'Tambahan klausul dan ketentuan yang disepakati setelah diskusi dengan stakeholders terkait.' }
];

async function downloadImage(url, filepath) {
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function login() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    authToken = response.data.token;
    console.log('✅ Login berhasil');
    return authToken;
  } catch (error) {
    console.error('❌ Login gagal:', error.response?.data || error.message);
    throw error;
  }
}

async function createMasterDocument(data, imagePath) {
  try {
    const form = new FormData();
    form.append('title', data.title);
    form.append('location', data.location);
    form.append('description', data.description);
    form.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(`${API_BASE}/documents`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log(`✅ Master dokumen dibuat: ${data.title}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Gagal membuat master dokumen ${data.title}:`, error.response?.data || error.message);
    throw error;
  }
}

async function createSubDocument(parentId, data, imagePath) {
  try {
    const form = new FormData();
    form.append('parentDocumentId', parentId);
    form.append('title', data.title);
    form.append('location', data.location);
    form.append('description', data.description);
    form.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(`${API_BASE}/documents/sub-document`, form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log(`  ✅ Sub dokumen dibuat: ${data.title}`);
    return response.data;
  } catch (error) {
    console.error(`  ❌ Gagal membuat sub dokumen ${data.title}:`, error.response?.data || error.message);
    throw error;
  }
}

async function generateDocuments() {
  try {
    console.log('🚀 Memulai generate 25 dokumen...\n');
    
    // Login terlebih dahulu
    await login();
    
    const uploadsDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let totalCreated = 0;
    
    for (let i = 0; i < masterDocuments.length && totalCreated < 25; i++) {
      const masterData = masterDocuments[i];
      
      // Download random image untuk master document
      const imageUrl = `https://picsum.photos/800/600?random=${i}`;
      const masterImagePath = path.join(uploadsDir, `temp-master-${i}.jpg`);
      
      console.log(`\n📄 [${i + 1}/${masterDocuments.length}] Mengunduh gambar untuk: ${masterData.title}`);
      await downloadImage(imageUrl, masterImagePath);
      
      // Create master document
      const masterDoc = await createMasterDocument(masterData, masterImagePath);
      totalCreated++;
      
      // Delete temporary image
      fs.unlinkSync(masterImagePath);
      
      // Randomly create 0-2 sub-documents untuk setiap master
      const subCount = Math.floor(Math.random() * 3); // 0, 1, atau 2
      
      for (let j = 0; j < subCount && totalCreated < 25; j++) {
        const subTemplate = subDocumentTemplates[j % subDocumentTemplates.length];
        const subData = {
          title: `${masterData.title} - ${subTemplate.suffix}`,
          location: masterData.location,
          description: subTemplate.desc
        };
        
        // Download random image untuk sub document
        const subImageUrl = `https://picsum.photos/800/600?random=${i}-${j}`;
        const subImagePath = path.join(uploadsDir, `temp-sub-${i}-${j}.jpg`);
        
        console.log(`  📎 Mengunduh gambar untuk sub-dokumen...`);
        await downloadImage(subImageUrl, subImagePath);
        
        // Create sub document
        await createSubDocument(masterDoc.id, subData, subImagePath);
        totalCreated++;
        
        // Delete temporary image
        fs.unlinkSync(subImagePath);
        
        // Delay sedikit untuk menghindari rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (totalCreated >= 25) break;
      
      // Delay antar master document
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n✨ Selesai! Total ${totalCreated} dokumen berhasil dibuat.`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

generateDocuments();
