'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add new columns to SubDocuments table
      await queryInterface.addColumn('SubDocuments', 'certificateType', {
        type: Sequelize.ENUM('SHM', 'SHGB', 'SHGU', 'SHP', 'HPL', 'AJB', 'Girik', 'Others'),
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'landSize', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'areaName', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'projectName', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'zoneUrl', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'zoneRtdr', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'publishDate', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'expiredDate', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'documentObtained', {
        type: Sequelize.DATE,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'originDocument', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'previousOwner', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'company', {
        type: Sequelize.ENUM('JH', 'JHT', 'BEP', 'PIJ'),
        allowNull: true,
        defaultValue: null
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Remove columns in reverse order
      await queryInterface.removeColumn('SubDocuments', 'company', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'previousOwner', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'originDocument', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'documentObtained', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'expiredDate', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'publishDate', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'zoneRtdr', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'zoneUrl', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'projectName', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'areaName', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'landSize', { transaction });
      await queryInterface.removeColumn('SubDocuments', 'certificateType', { transaction });
    });
  }
};
