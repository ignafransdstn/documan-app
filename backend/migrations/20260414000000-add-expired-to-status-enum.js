'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_Documents_status" ADD VALUE IF NOT EXISTS 'expired';
    `);
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_SubDocuments_status" ADD VALUE IF NOT EXISTS 'expired';
    `);
  },

  async down() {
    // PostgreSQL does not support removing enum values
  }
};
