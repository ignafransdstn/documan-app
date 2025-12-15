'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add category column to Documents table
      await queryInterface.addColumn('Documents', 'category', {
        type: Sequelize.ENUM('Corporate Document', 'Permit Document'),
        defaultValue: 'Corporate Document',
        allowNull: false
      });

      // Add category column to SubDocuments table
      await queryInterface.addColumn('SubDocuments', 'category', {
        type: Sequelize.ENUM('Corporate Document', 'Permit Document'),
        defaultValue: 'Corporate Document',
        allowNull: false
      });

      console.log('Migration: Added category field to Documents and SubDocuments tables');
    } catch (error) {
      console.error('Migration error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove category column from SubDocuments table
      await queryInterface.removeColumn('SubDocuments', 'category');

      // Remove category column from Documents table
      await queryInterface.removeColumn('Documents', 'category');

      // Remove ENUM type
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Documents_category";');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_SubDocuments_category";');

      console.log('Migration rollback: Removed category field');
    } catch (error) {
      console.error('Migration rollback error:', error);
      throw error;
    }
  }
};
