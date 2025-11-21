const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Sample data for Indonesian cities and document types
const cities = [
  'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang', 
  'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bekasi',
  'Yogyakarta', 'Malang', 'Denpasar', 'Manado', 'Balikpapan',
  'Pontianak', 'Batam', 'Banjarmasin', 'Pekanbaru', 'Samarinda',
  'Padang', 'Jambi', 'Cirebon', 'Sukabumi', 'Mataram',
  'Bandar Lampung', 'Serang', 'Cilegon', 'Kupang', 'Jayapura',
  'Ambon', 'Bengkulu', 'Palu', 'Kendari', 'Gorontalo'
];

const documentTitles = [
  'Rencana Strategis Perusahaan',
  'Laporan Keuangan Tahunan',
  'Kebijakan Sumber Daya Manusia',
  'Prosedur Operasional Standar',
  'Analisis Pasar Kompetitif',
  'Rencana Kontinuitas Bisnis',
  'Kebijakan Perlindungan Data Pribadi',
  'Kontrak Sewa Kantor Cabang',
  'Kebijakan Keamanan Informasi',
  'Laporan Audit Internal',
  'Rencana Pemasaran Digital',
  'Kebijakan Lingkungan Kerja',
  'Perjanjian Kerjasama Strategis',
  'Manual Penggunaan Sistem',
  'Kebijakan Anti-Korupsi',
  'Rencana Pengembangan Produk',
  'Laporan Kinerja Kuartalan',
  'Kebijakan Kesehatan dan Keselamatan Kerja',
  'Standar Kualitas Layanan',
  'Rencana Transformasi Digital',
  'Kebijakan Manajemen Risiko',
  'Laporan Evaluasi Proyek',
  'Prosedur Penanganan Keluhan',
  'Rencana Ekspansi Regional',
  'Kebijakan Pengadaan Barang',
  'Laporan Penelitian Pasar',
  'Manual Pelatihan Karyawan',
  'Kebijakan Remunerasi',
  'Rencana Investasi Infrastruktur',
  'Laporan Kepuasan Pelanggan',
  'Kebijakan Inovasi Produk',
  'Standar Etika Bisnis',
  'Rencana Mitigasi Bencana',
  'Laporan Compliance Regulasi',
  'Kebijakan Keberagaman dan Inklusi'
];

const descriptions = [
  'Dokumen strategis yang menguraikan visi, misi, dan target jangka panjang perusahaan dalam menghadapi dinamika pasar yang terus berkembang.',
  'Laporan komprehensif mengenai kondisi finansial perusahaan, mencakup neraca, laba rugi, dan arus kas untuk periode pelaporan.',
  'Panduan lengkap tentang pengelolaan karyawan, termasuk rekrutmen, pengembangan, kompensasi, dan kebijakan kesejahteraan.',
  'Dokumen teknis yang merinci langkah-langkah operasional standar untuk memastikan konsistensi dan efisiensi dalam proses bisnis.',
  'Analisis mendalam tentang posisi kompetitif perusahaan di pasar, termasuk identifikasi peluang dan ancaman strategis.',
  'Rencana terstruktur untuk memastikan kelangsungan operasional bisnis dalam menghadapi berbagai skenario krisis atau gangguan.',
  'Kebijakan formal yang mengatur pengumpulan, penyimpanan, dan penggunaan data pribadi sesuai dengan regulasi perlindungan data.',
  'Perjanjian legal yang mengatur hak dan kewajiban terkait penyewaan ruang kantor untuk operasional cabang perusahaan.',
  'Dokumen yang menetapkan standar dan prosedur untuk melindungi aset informasi perusahaan dari ancaman internal dan eksternal.',
  'Laporan hasil pemeriksaan internal terhadap proses bisnis, kontrol internal, dan kepatuhan terhadap kebijakan perusahaan.',
  'Strategi pemasaran yang memanfaatkan platform digital untuk meningkatkan brand awareness dan customer engagement.',
  'Pedoman yang mengatur standar lingkungan kerja yang kondusif, aman, dan mendukung produktivitas karyawan.',
  'Dokumen resmi yang merinci kesepakatan kerjasama dengan mitra bisnis untuk mencapai tujuan bersama yang strategis.',
  'Panduan teknis lengkap untuk pengguna sistem, mencakup instalasi, konfigurasi, dan troubleshooting aplikasi perusahaan.',
  'Kebijakan komprehensif yang menetapkan standar integritas, transparansi, dan akuntabilitas dalam seluruh aspek bisnis.',
  'Roadmap pengembangan produk yang mencakup riset pasar, desain, pengujian, dan strategi peluncuran ke pasar.',
  'Laporan evaluasi kinerja perusahaan per kuartal, mencakup pencapaian target, analisis varians, dan rekomendasi perbaikan.',
  'Kebijakan yang mengatur standar keselamatan kerja dan kesehatan karyawan untuk mencegah kecelakaan dan penyakit akibat kerja.',
  'Dokumen yang menetapkan standar kualitas layanan pelanggan dan metrik untuk mengukur kepuasan pelanggan secara berkala.',
  'Strategi transformasi untuk mengadopsi teknologi digital dalam seluruh aspek operasional dan model bisnis perusahaan.',
  'Framework untuk mengidentifikasi, menganalisis, dan mengelola risiko yang dapat mempengaruhi pencapaian tujuan bisnis.',
  'Laporan evaluasi komprehensif terhadap proyek yang telah selesai, mencakup analisis biaya, waktu, dan kualitas deliverables.',
  'Prosedur standar untuk menerima, menangani, dan menyelesaikan keluhan pelanggan dengan efektif dan profesional.',
  'Rencana ekspansi bisnis ke wilayah baru, mencakup analisis pasar, strategi entry, dan proyeksi keuangan.',
  'Kebijakan yang mengatur proses pengadaan barang dan jasa untuk memastikan efisiensi, transparansi, dan value for money.',
  'Hasil riset pasar mendalam tentang tren industri, perilaku konsumen, dan peluang pengembangan produk baru.',
  'Modul pelatihan terstruktur untuk meningkatkan kompetensi dan keterampilan karyawan sesuai kebutuhan bisnis.',
  'Kebijakan yang mengatur struktur gaji, tunjangan, insentif, dan benefit karyawan secara adil dan kompetitif.',
  'Rencana investasi jangka panjang untuk pembangunan dan peningkatan infrastruktur pendukung operasional perusahaan.',
  'Laporan hasil survei kepuasan pelanggan yang mencakup analisis feedback dan rekomendasi peningkatan layanan.',
  'Kebijakan yang mendorong budaya inovasi dalam pengembangan produk dan layanan untuk mempertahankan daya saing.',
  'Kode etik yang menjadi pedoman perilaku bisnis yang bertanggung jawab, jujur, dan berintegritas tinggi.',
  'Rencana kesiapsiagaan untuk menghadapi bencana alam dan krisis lainnya guna melindungi aset dan keselamatan karyawan.',
  'Laporan kepatuhan terhadap regulasi dan peraturan yang berlaku di industri untuk menghindari risiko legal.',
  'Kebijakan yang mempromosikan lingkungan kerja yang inklusif dan menghargai keberagaman latar belakang karyawan.'
];

const subDocTypes = [
  { prefix: 'Lampiran A', desc: 'Lampiran tambahan yang berisi data pendukung dan referensi detail untuk dokumen utama.' },
  { prefix: 'Lampiran B', desc: 'Dokumen pelengkap yang mencakup tabel, grafik, dan visualisasi data yang relevan.' },
  { prefix: 'Revisi 1', desc: 'Versi terbaru dokumen dengan perbaikan dan pembaruan berdasarkan feedback stakeholder.' },
  { prefix: 'Addendum', desc: 'Penambahan klausul atau informasi baru yang melengkapi dokumen induk tanpa mengubah isi asli.' }
];

// Sample PDF URLs that can be downloaded
const samplePdfUrls = [
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  'https://www.africau.edu/images/default/sample.pdf',
  'https://scholar.harvard.edu/files/torman_personal/files/samplepptx.pdf',
  'https://file-examples.com/storage/fe783c5cb8e81c70a24be7b/2017/10/file-sample_150kB.pdf'
];

async function downloadPdf(url, outputPath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download from ${url}:`, error.message);
    throw error;
  }
}

async function createDummyPdf(outputPath, title, description) {
  // If download fails, create a simple PDF using pdfkit
  const PDFDocument = require('pdfkit');
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 50, bottom: 50, left: 50, right: 50 } });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    doc.fontSize(20).fillColor('#1a1a1a').text(title, { align: 'center' }).moveDown(2);
    doc.fontSize(12).fillColor('#333333').text(description, { align: 'justify', lineGap: 5 }).moveDown(2);
    doc.fontSize(10).fillColor('#666666').text('Dokumen ini dibuat secara otomatis oleh sistem.', { align: 'center' }).moveDown();
    doc.fontSize(8).fillColor('#999999').text(`Generated on ${new Date().toLocaleString('id-ID')}`, { align: 'center' });

    doc.end();
    stream.on('finish', () => resolve());
    stream.on('error', (err) => reject(err));
  });
}

async function uploadDocument(formData, token) {
  try {
    const response = await axios.post('http://127.0.0.1:5001/api/documents', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
    throw new Error(errorMsg);
  }
}

async function uploadSubDocument(formData, token) {
  try {
    const response = await axios.post('http://127.0.0.1:5001/api/documents/sub-document', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message);
  }
}

async function login() {
  try {
    const response = await axios.post('http://127.0.0.1:5001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    throw new Error('Login failed: ' + (error.response?.data?.message || error.message));
  }
}

function getRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateDocuments() {
  console.log('🚀 Starting document generation with random PDFs...\n');

  try {
    // Login
    console.log('🔐 Logging in...');
    const token = await login();
    console.log('✅ Login successful!\n');

    const tempDir = path.join(__dirname, '../../temp-pdfs');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    let masterCount = 0;
    let subCount = 0;
    let totalDocs = 0;

    // Generate 25 master documents
    const numMasters = 25;
    console.log(`📄 Generating ${numMasters} master documents...\n`);

    for (let i = 0; i < numMasters && totalDocs < 35; i++) {
      const title = getRandom(documentTitles);
      const location = getRandom(cities) + ', Indonesia';
      const description = getRandom(descriptions);
      
      const tempPdfPath = path.join(tempDir, `temp-master-${i}.pdf`);
      
      // Create PDF directly (skip download)
      console.log(`  📝 Creating PDF...`);
      await createDummyPdf(tempPdfPath, title, description);

      const formData = new FormData();
      formData.append('document', fs.createReadStream(tempPdfPath));
      formData.append('title', title);
      formData.append('location', location);
      formData.append('description', description);

      try {
        const result = await uploadDocument(formData, token);
        masterCount++;
        totalDocs++;
        console.log(`  ✅ [${totalDocs}/35] Master: ${result.documentNo} - ${title.substring(0, 40)}...`);

        // Clean up temp file
        fs.unlinkSync(tempPdfPath);

        // Maybe add sub-documents (0-2 random)
        if (totalDocs < 35) {
          const numSubs = getRandomInt(0, 2);
          
          for (let j = 0; j < numSubs && totalDocs < 35; j++) {
            const subType = getRandom(subDocTypes);
            const subTitle = `${subType.prefix} - ${title}`;
            const subDesc = subType.desc;
            const subTempPath = path.join(tempDir, `temp-sub-${i}-${j}.pdf`);

            console.log(`    📝 Creating sub PDF...`);
            await createDummyPdf(subTempPath, subTitle, subDesc);

            const subFormData = new FormData();
            subFormData.append('document', fs.createReadStream(subTempPath));
            subFormData.append('title', subTitle);
            subFormData.append('location', location);
            subFormData.append('description', subDesc);
            subFormData.append('parentDocumentId', result.id.toString());
            subFormData.append('subDocumentNo', `SUB-${String(j + 1).padStart(3, '0')}`);

            try {
              const subResult = await uploadSubDocument(subFormData, token);
              subCount++;
              totalDocs++;
              console.log(`    ↳ ✅ [${totalDocs}/35] Sub: ${subResult.subDocumentNo} - ${subTitle.substring(0, 35)}...`);
              fs.unlinkSync(subTempPath);
            } catch (error) {
              console.log(`    ↳ ❌ Failed to create sub-document: ${error.message}`);
              if (fs.existsSync(subTempPath)) fs.unlinkSync(subTempPath);
            }
          }
        }

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`  ❌ Failed to create master document: ${error.message}`);
        console.log(`     Full error:`, error.response?.data || error);
        if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);
      }

      if (totalDocs >= 35) break;
    }

    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 GENERATION COMPLETE!');
    console.log(`   📁 Master Documents: ${masterCount}`);
    console.log(`   📑 Sub Documents: ${subCount}`);
    console.log(`   📝 Total Documents: ${totalDocs}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

generateDocuments()
  .then(() => {
    console.log('\n✨ Document generation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Generation failed:', error);
    process.exit(1);
  });
