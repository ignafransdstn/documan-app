'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'physicalLocation', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Documents', 'physicalLocationDetail', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('SubDocuments', 'physicalLocation', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('SubDocuments', 'physicalLocationDetail', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'physicalLocation');
    await queryInterface.removeColumn('Documents', 'physicalLocationDetail');
    await queryInterface.removeColumn('SubDocuments', 'physicalLocation');
    await queryInterface.removeColumn('SubDocuments', 'physicalLocationDetail');
  }
};
