'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Documents', 'issuingAgency', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('SubDocuments', 'issuingAgency', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Documents', 'issuingAgency');
    await queryInterface.removeColumn('SubDocuments', 'issuingAgency');
  }
};
