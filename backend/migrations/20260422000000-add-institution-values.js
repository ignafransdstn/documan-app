'use strict';

/** Migration: Tambah nilai ENUM institusi baru (KEJATI, KEJARI, KEJAGUNG, MA, MK) */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Projects_institution"
        ADD VALUE IF NOT EXISTS 'KEJATI';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Projects_institution"
        ADD VALUE IF NOT EXISTS 'KEJARI';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Projects_institution"
        ADD VALUE IF NOT EXISTS 'KEJAGUNG';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Projects_institution"
        ADD VALUE IF NOT EXISTS 'MA';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Projects_institution"
        ADD VALUE IF NOT EXISTS 'MK';
    `);
  },

  async down(queryInterface) {
    // PostgreSQL tidak mendukung DROP VALUE dari ENUM secara langsung.
    // Untuk rollback penuh, perlu recreate tipe — diabaikan karena berisiko kehilangan data.
  }
};
