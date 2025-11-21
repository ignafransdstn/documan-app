const { sequelize, Document } = require('../models');

async function addDocumentNoColumn() {
  try {
    console.log('Starting migration: Adding documentNo column to Documents table...');

    // Add column if it doesn't exist
    await sequelize.query(`
      ALTER TABLE "Documents" 
      ADD COLUMN IF NOT EXISTS "documentNo" VARCHAR(255);
    `);

    console.log('Column added successfully.');

    // Update existing documents with auto-generated documentNo
    const documents = await Document.findAll({
      order: [['id', 'ASC']]
    });

    console.log(`Found ${documents.length} existing documents. Generating document numbers...`);

    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      if (!doc.documentNo) {
        const documentNo = `MD-${(i + 1).toString().padStart(6, '0')}`;
        await doc.update({ documentNo });
        console.log(`Updated Document ID ${doc.id} with ${documentNo}`);
      }
    }

    // Add unique constraint
    await sequelize.query(`
      ALTER TABLE "Documents" 
      ADD CONSTRAINT "Documents_documentNo_unique" UNIQUE ("documentNo");
    `);

    console.log('Unique constraint added.');

    // Make column NOT NULL
    await sequelize.query(`
      ALTER TABLE "Documents" 
      ALTER COLUMN "documentNo" SET NOT NULL;
    `);

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

addDocumentNoColumn();
