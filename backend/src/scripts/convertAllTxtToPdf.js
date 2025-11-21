const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

async function convertAllTxtFiles() {
  console.log('🔄 Converting all .txt files in uploads folder to PDF...\n');

  const uploadsDir = path.join(__dirname, '../../uploads');
  
  try {
    const files = fs.readdirSync(uploadsDir);
    const txtFiles = files.filter(file => path.extname(file).toLowerCase() === '.txt');
    
    console.log(`📊 Found ${txtFiles.length} .txt files to convert\n`);

    let convertedCount = 0;
    let errorCount = 0;

    for (const txtFile of txtFiles) {
      const inputPath = path.join(uploadsDir, txtFile);
      const baseName = path.basename(txtFile, '.txt');
      const outputPath = path.join(uploadsDir, baseName + '.pdf');

      try {
        await convertTextToPdf(inputPath, outputPath);
        
        // Delete original .txt file
        fs.unlinkSync(inputPath);
        
        convertedCount++;
        console.log(`✅ ${txtFile} → ${baseName}.pdf`);
      } catch (error) {
        errorCount++;
        console.log(`❌ ${txtFile}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 CONVERSION SUMMARY:');
    console.log(`   ✅ Converted: ${convertedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

function convertTextToPdf(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Read text file
      const textContent = fs.readFileSync(inputPath, 'utf-8');

      // Add header
      doc.fontSize(16)
         .fillColor('#1a1a1a')
         .text('Document Management System', { align: 'center' })
         .moveDown();

      // Add content
      doc.fontSize(11)
         .fillColor('#333333')
         .text(textContent || 'No content', {
           align: 'left',
           lineGap: 4
         });

      // Add footer with conversion info
      doc.moveDown(2)
         .fontSize(8)
         .fillColor('#999999')
         .text(`Converted to PDF on ${new Date().toLocaleString('id-ID')}`, {
           align: 'center'
         });

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
}

// Run the conversion
convertAllTxtFiles()
  .then(() => {
    console.log('\n✨ All .txt files have been converted to PDF!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Conversion failed:', error);
    process.exit(1);
  });
