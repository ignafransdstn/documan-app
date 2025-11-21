const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ActivityLog extends Model {
    static associate(models) {
      ActivityLog.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  ActivityLog.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'DOWNLOAD'),
      allowNull: false
    },
    entityType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'document, subdocument, user, etc'
    },
    entityId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'ActivityLog',
    tableName: 'ActivityLogs',
    timestamps: true,
    paranoid: false
  });

  return ActivityLog;
};
