module.exports = (sequelize, DataTypes) => {
  const FormApproval = sequelize.define(
    'FormApproval',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      submissionId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      approverUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      approvalStatus: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      approvalOrder: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      reviewedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'FormApprovals',
      timestamps: true
    }
  );

  FormApproval.associate = (models) => {
    FormApproval.belongsTo(models.FormSubmission, { foreignKey: 'submissionId' });
    FormApproval.belongsTo(models.User, { foreignKey: 'approverUserId', as: 'approver' });
  };

  return FormApproval;
};
