'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add new columns to Documents table
      await queryInterface.addColumn('Documents', 'certificateType', {
        type: Sequelize.ENUM('SHM', 'SHGB', 'SHGU', 'SHP', 'HPL', 'AJB', 'Girik', 'Others'),
        allowNull: true, // Set to true initially to allow existing records
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('Documents', 'landSize', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'areaName', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'projectName', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'zoneUrl', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'zoneRtdr', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'publishDate', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'expiredDate', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'documentObtained', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'originDocument', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'previousOwner', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('Documents', 'company', {
        type: Sequelize.ENUM('JH', 'JHT', 'BEP', 'PIJ'),
        allowNull: true, // Set to true initially to allow existing records
        defaultValue: null
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove columns in reverse order
      await queryInterface.removeColumn('Documents', 'company', { transaction });
      await queryInterface.removeColumn('Documents', 'previousOwner', { transaction });
      await queryInterface.removeColumn('Documents', 'originDocument', { transaction });
      await queryInterface.removeColumn('Documents', 'documentObtained', { transaction });
      await queryInterface.removeColumn('Documents', 'expiredDate', { transaction });
      await queryInterface.removeColumn('Documents', 'publishDate', { transaction });
      await queryInterface.removeColumn('Documents', 'zoneRtdr', { transaction });
      await queryInterface.removeColumn('Documents', 'zoneUrl', { transaction });
      await queryInterface.removeColumn('Documents', 'projectName', { transaction });
      await queryInterface.removeColumn('Documents', 'areaName', { transaction });
      await queryInterface.removeColumn('Documents', 'landSize', { transaction });
      await queryInterface.removeColumn('Documents', 'certificateType', { transaction });
    });
  }
};
