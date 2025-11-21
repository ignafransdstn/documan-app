const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { Document, SubDocument } = require('../models');

async function convertToPdf() {
  console.log('🔄 Starting conversion of all files to PDF...\n');

  const uploadsDir = path.join(__dirname, '../../uploads');
  
  try {
    // Get all documents and subdocuments from database
    const documents = await Document.findAll();
    const subDocuments = await SubDocument.findAll();
    
    let convertedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`📊 Found ${documents.length} master documents and ${subDocuments.length} sub-documents\n`);

    // Convert master documents
    for (const doc of documents) {
      if (!doc.filePath) continue;
      
      const result = await convertFile(uploadsDir, doc.filePath, doc.id, 'master');
      if (result.converted) {
        doc.filePath = result.newPath;
        await doc.save();
        convertedCount++;
        console.log(`✅ Master Doc ${doc.id}: ${result.message}`);
      } else if (result.skipped) {
        skippedCount++;
        console.log(`⏭️  Master Doc ${doc.id}: ${result.message}`);
      } else {
        errorCount++;
        console.log(`❌ Master Doc ${doc.id}: ${result.message}`);
      }
    }

    // Convert sub documents
    for (const subDoc of subDocuments) {
      if (!subDoc.filePath) continue;
      
      const result = await convertFile(uploadsDir, subDoc.filePath, subDoc.id, 'sub');
      if (result.converted) {
        subDoc.filePath = result.newPath;
        await subDoc.save();
        convertedCount++;
        console.log(`✅ Sub Doc ${subDoc.id}: ${result.message}`);
      } else if (result.skipped) {
        skippedCount++;
        console.log(`⏭️  Sub Doc ${subDoc.id}: ${result.message}`);
      } else {
        errorCount++;
        console.log(`❌ Sub Doc ${subDoc.id}: ${result.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📈 CONVERSION SUMMARY:');
    console.log(`   ✅ Converted: ${convertedCount}`);
    console.log(`   ⏭️  Skipped (already PDF): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

async function convertFile(uploadsDir, filePath, docId, type) {
  const fullPath = path.join(uploadsDir, filePath);
  const ext = path.extname(filePath).toLowerCase();
  
  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return { error: true, message: `File not found: ${filePath}` };
  }

  // Skip if already PDF
  if (ext === '.pdf') {
    return { skipped: true, message: 'Already PDF' };
  }

  // Generate new PDF filename
  const timestamp = Date.now();
  const randomNum = Math.round(Math.random() * 1E9);
  const newFilename = `${timestamp}-${randomNum}.pdf`;
  const newFullPath = path.join(uploadsDir, newFilename);

  try {
    // Convert based on file type
    if (ext === '.txt' || ext === '.text') {
      // Convert text file to PDF
      await convertTextToPdf(fullPath, newFullPath);
      
      // Delete old file
      fs.unlinkSync(fullPath);
      
      return { 
        converted: true, 
        newPath: newFilename, 
        message: `Converted ${ext} to PDF` 
      };
    } else {
      // For other file types, create a placeholder PDF with file info
      await createPlaceholderPdf(newFullPath, filePath, ext);
      
      // Keep the old file (don't delete for now)
      
      return { 
        converted: true, 
        newPath: newFilename, 
        message: `Created placeholder PDF for ${ext} file` 
      };
    }
  } catch (error) {
    return { 
      error: true, 
      message: `Conversion failed: ${error.message}` 
    };
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
         .text('Converted Document', { align: 'center' })
         .moveDown();

      // Add content
      doc.fontSize(11)
         .fillColor('#333333')
         .text(textContent, {
           align: 'left',
           lineGap: 4
         });

      // Add footer with conversion info
      doc.moveDown(2)
         .fontSize(8)
         .fillColor('#999999')
         .text(`Converted from text file on ${new Date().toLocaleString()}`, {
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

function createPlaceholderPdf(outputPath, originalFile, ext) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 100, bottom: 100, left: 100, right: 100 }
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Title
      doc.fontSize(24)
         .fillColor('#e74c3c')
         .text('⚠️ Document Conversion Notice', { align: 'center' })
         .moveDown(2);

      // Message
      doc.fontSize(14)
         .fillColor('#333333')
         .text('This file was originally in a format that requires special conversion:', {
           align: 'center'
         })
         .moveDown();

      doc.fontSize(16)
         .fillColor('#2c3e50')
         .text(`Original File: ${path.basename(originalFile)}`, { align: 'center' })
         .moveDown();

      doc.fontSize(14)
         .fillColor('#7f8c8d')
         .text(`File Type: ${ext.toUpperCase()}`, { align: 'center' })
         .moveDown(2);

      // Instructions
      doc.fontSize(12)
         .fillColor('#555555')
         .text('To view the original file:', { align: 'left' })
         .moveDown(0.5)
         .fontSize(11)
         .text('1. Contact system administrator', { align: 'left' })
         .text('2. Use the download function to get the original file', { align: 'left' })
         .text('3. Open with appropriate software', { align: 'left' })
         .moveDown(2);

      // Footer
      doc.fontSize(9)
         .fillColor('#95a5a6')
         .text(`Placeholder PDF created on ${new Date().toLocaleString()}`, {
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
convertToPdf()
  .then(() => {
    console.log('\n✨ Conversion process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Conversion process failed:', error);
    process.exit(1);
  });
