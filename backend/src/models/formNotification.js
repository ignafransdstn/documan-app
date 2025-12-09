module.exports = (sequelize, DataTypes) => {
  const FormNotification = sequelize.define(
    'FormNotification',
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
      recipientUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM('submitted', 'approved', 'rejected', 'archived'),
        allowNull: false
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      emailStatus: {
        type: DataTypes.ENUM('pending', 'sent', 'failed'),
        defaultValue: 'pending'
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      readAt: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'FormNotifications',
      timestamps: true
    }
  );

  FormNotification.associate = (models) => {
    FormNotification.belongsTo(models.FormSubmission, { foreignKey: 'submissionId', as: 'submission' });
    FormNotification.belongsTo(models.User, { foreignKey: 'recipientUserId', as: 'recipient' });
  };

  return FormNotification;
};
