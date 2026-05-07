'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Projects', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('project', 'dispute'),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      number: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Project number or dispute number'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'closed', 'on_hold'),
        allowNull: false,
        defaultValue: 'active'
      },
      institution: {
        type: Sequelize.ENUM('POLSEK', 'POLRES', 'POLDA', 'OTHERS'),
        allowNull: true,
        comment: 'Only for dispute type'
      },
      institutionDetail: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Additional detail for OTHERS institution'
      },
      startDate: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      estimatedEndDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      actualEndDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('Projects');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Projects_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Projects_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Projects_institution";');
  }
};
