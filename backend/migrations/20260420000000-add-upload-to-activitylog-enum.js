'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_ActivityLogs_action" ADD VALUE IF NOT EXISTS 'UPLOAD';
    `);
  },

  async down() {
    // PostgreSQL does not support removing enum values
  }
};
