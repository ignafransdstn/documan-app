'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Forms table
    await queryInterface.createTable('Forms', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      originalFile: {
        type: Sequelize.BLOB,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('active', 'archived', 'deleted'),
        defaultValue: 'active'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 2. Create FormFields table
    await queryInterface.createTable('FormFields', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      formId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Forms',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      fieldName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      fieldType: {
        type: Sequelize.ENUM('text', 'date', 'number', 'select', 'textarea'),
        defaultValue: 'text'
      },
      isRequired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      placeholder: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      validationRules: {
        type: Sequelize.JSON,
        allowNull: true
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 3. Create FormSubmissions table
    await queryInterface.createTable('FormSubmissions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      formId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Forms',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      submittedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      submissionData: {
        type: Sequelize.JSON,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected', 'archived'),
        defaultValue: 'draft'
      },
      approver1UserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      approver2UserId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      submittedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      archivedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      archivedAsDocumentId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Documents',
          key: 'id'
        }
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 4. Create FormApprovals table
    await queryInterface.createTable('FormApprovals', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      submissionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FormSubmissions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      approverUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      approvalStatus: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      approvalOrder: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      rejectionReason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      approvedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 5. Create FormNotifications table
    await queryInterface.createTable('FormNotifications', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      submissionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'FormSubmissions',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      recipientUserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      type: {
        type: Sequelize.ENUM('submitted', 'approved', 'rejected', 'archived'),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      emailStatus: {
        type: Sequelize.ENUM('pending', 'sent', 'failed'),
        defaultValue: 'pending'
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // 6. Add columns to Documents table
    await queryInterface.addColumn('Documents', 'formSubmissionId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'FormSubmissions',
        key: 'id'
      }
    });

    await queryInterface.addColumn('Documents', 'generatedFromForm', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    // 7. Create indexes
    await queryInterface.addIndex('Forms', ['status']);
    await queryInterface.addIndex('Forms', ['createdBy']);
    await queryInterface.addIndex('FormFields', ['formId']);
    await queryInterface.addIndex('FormSubmissions', ['formId']);
    await queryInterface.addIndex('FormSubmissions', ['submittedBy']);
    await queryInterface.addIndex('FormSubmissions', ['status']);
    await queryInterface.addIndex('FormApprovals', ['submissionId']);
    await queryInterface.addIndex('FormApprovals', ['approverUserId']);
    await queryInterface.addIndex('FormNotifications', ['submissionId']);
    await queryInterface.addIndex('FormNotifications', ['recipientUserId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('FormNotifications');
    await queryInterface.dropTable('FormApprovals');
    await queryInterface.dropTable('FormSubmissions');
    await queryInterface.dropTable('FormFields');
    await queryInterface.dropTable('Forms');

    await queryInterface.removeColumn('Documents', 'formSubmissionId');
    await queryInterface.removeColumn('Documents', 'generatedFromForm');
  }
};
