const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Database connection
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  logging: console.log,
});

async function addDescriptionColumn() {
  try {
    console.log('🔄 Starting migration to add description columns...');

    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Add description column to Documents table
    console.log('📝 Adding description column to Documents table...');
    await sequelize.query(`
      ALTER TABLE "Documents" 
      ADD COLUMN IF NOT EXISTS "description" VARCHAR(350) DEFAULT '';
    `);
    console.log('✅ Description column added to Documents table.');

    // Add description column to SubDocuments table
    console.log('📝 Adding description column to SubDocuments table...');
    await sequelize.query(`
      ALTER TABLE "SubDocuments" 
      ADD COLUMN IF NOT EXISTS "description" VARCHAR(350) DEFAULT '';
    `);
    console.log('✅ Description column added to SubDocuments table.');

    // Verify the changes
    console.log('\n📊 Verifying columns...');
    const [documentsColumns] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'Documents' AND column_name = 'description';
    `);
    
    const [subDocumentsColumns] = await sequelize.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'SubDocuments' AND column_name = 'description';
    `);

    if (documentsColumns.length > 0) {
      console.log('✅ Documents.description:', documentsColumns[0]);
    }
    
    if (subDocumentsColumns.length > 0) {
      console.log('✅ SubDocuments.description:', subDocumentsColumns[0]);
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addDescriptionColumn();
