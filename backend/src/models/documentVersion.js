const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DocumentVersion extends Model {
    static associate(models) {
      DocumentVersion.belongsTo(models.Document, {
        foreignKey: 'documentId',
        as: 'document'
      });
      DocumentVersion.belongsTo(models.SubDocument, {
        foreignKey: 'subDocumentId',
        as: 'subDocument'
      });
      DocumentVersion.belongsTo(models.User, {
        foreignKey: 'uploadedBy',
        as: 'uploader'
      });
    }
  }

  DocumentVersion.init({
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    subDocumentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    label: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'DocumentVersion'
  });

  return DocumentVersion;
};
