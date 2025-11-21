const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SubDocument extends Model {
    static associate(models) {
      SubDocument.belongsTo(models.Document, {
        foreignKey: 'parentDocumentId',
        as: 'parentDocument'
      });
    }
  }

  SubDocument.init({
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subDocumentNo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false // Multiple parents can have SUB-001
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    parentDocumentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Documents',
        key: 'id'
      }
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(350),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'deleted'),
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'SubDocument',
    paranoid: true // Enables soft deletes
  });

  return SubDocument;
};