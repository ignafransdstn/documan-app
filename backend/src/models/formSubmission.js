module.exports = (sequelize, DataTypes) => {
  const FormSubmission = sequelize.define(
    'FormSubmission',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      formId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      submittedBy: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      submissionData: {
        type: DataTypes.JSON,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'archived'),
        defaultValue: 'draft'
      },
      approver1UserId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      approver2UserId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      submittedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      archivedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      archivedAsDocumentId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: 'FormSubmissions',
      timestamps: true
    }
  );

  FormSubmission.associate = (models) => {
    FormSubmission.belongsTo(models.Form, { foreignKey: 'formId', as: 'form' });
    FormSubmission.belongsTo(models.User, { foreignKey: 'submittedBy', as: 'submitter' });
    FormSubmission.belongsTo(models.User, { foreignKey: 'approver1UserId', as: 'approver1' });
    FormSubmission.belongsTo(models.User, { foreignKey: 'approver2UserId', as: 'approver2' });
    FormSubmission.hasMany(models.FormApproval, { foreignKey: 'submissionId', as: 'approvals' });
    FormSubmission.hasMany(models.FormNotification, { foreignKey: 'submissionId', as: 'notifications' });
    FormSubmission.belongsTo(models.Document, { foreignKey: 'archivedAsDocumentId', as: 'archivedDocument' });
  };

  return FormSubmission;
};
