const fs = require('fs');
const path = require('path');
const { Document, SubDocument } = require('../models');

async function cleanupMissingFiles() {
  console.log('🧹 Cleaning up database records for missing files...\n');

  const uploadsDir = path.join(__dirname, '../../uploads');
  
  try {
    const documents = await Document.findAll();
    const subDocuments = await SubDocument.findAll();
    
    let deletedDocs = 0;
    let deletedSubDocs = 0;

    // Check master documents
    for (const doc of documents) {
      if (doc.filePath) {
        const fullPath = path.join(uploadsDir, doc.filePath);
        if (!fs.existsSync(fullPath)) {
          console.log(`❌ Deleting Master Doc ${doc.id}: ${doc.filePath} (file not found)`);
          await doc.destroy({ force: true });
          deletedDocs++;
        }
      }
    }

    // Check sub documents
    for (const subDoc of subDocuments) {
      if (subDoc.filePath) {
        const fullPath = path.join(uploadsDir, subDoc.filePath);
        if (!fs.existsSync(fullPath)) {
          console.log(`❌ Deleting Sub Doc ${subDoc.id}: ${subDoc.filePath} (file not found)`);
          await subDoc.destroy({ force: true });
          deletedSubDocs++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP SUMMARY:');
    console.log(`   🗑️  Deleted master documents: ${deletedDocs}`);
    console.log(`   🗑️  Deleted sub documents: ${deletedSubDocs}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupMissingFiles()
  .then(() => {
    console.log('\n✨ Cleanup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
