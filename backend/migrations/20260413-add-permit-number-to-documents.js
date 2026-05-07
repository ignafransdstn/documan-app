'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn('Documents', 'permitNumber', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      }, { transaction });

      await queryInterface.addColumn('SubDocuments', 'permitNumber', {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: null
      }, { transaction });
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeColumn('SubDocuments', 'permitNumber', { transaction });
      await queryInterface.removeColumn('Documents', 'permitNumber', { transaction });
    });
  }
};
