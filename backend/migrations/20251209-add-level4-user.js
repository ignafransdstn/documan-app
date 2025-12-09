'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add level4 to userLevel enum for Users table
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" ADD CONSTRAINT "Users_userLevel_check_v2" 
      CHECK ("userLevel" IN ('admin', 'level1', 'level2', 'level3', 'level4'))
    `).catch(() => {
      // Constraint might already exist
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert to original enum without level4
    await queryInterface.sequelize.query(`
      ALTER TABLE "Users" DROP CONSTRAINT IF EXISTS "Users_userLevel_check_v2"
    `).catch(() => {
      // Ignore if constraint doesn't exist
    });
  }
};
