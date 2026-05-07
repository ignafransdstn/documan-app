const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class SubDocument extends Model {
    static associate(models) {
      SubDocument.belongsTo(models.Document, {
        foreignKey: 'parentDocumentId',
        as: 'parentDocument'
      });
      SubDocument.hasMany(models.DocumentVersion, {
        foreignKey: 'subDocumentId',
        as: 'versions'
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
    category: {
      type: DataTypes.ENUM('Corporate Document', 'Permit Document'),
      allowNull: false,
      defaultValue: 'Corporate Document'
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'expired', 'deleted'),
      defaultValue: 'active'
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // New certificate and property fields (inherited from parent)
    certificateType: {
      type: DataTypes.ENUM('SHM', 'SHGB', 'SHGU', 'SHP', 'HPL', 'AJB', 'Girik', 'Others'),
      allowNull: true
    },
    landSize: {
      type: DataTypes.STRING,
      allowNull: true
    },
    areaName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    projectName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    zoneUrl: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    zoneRtdr: {
      type: DataTypes.STRING,
      allowNull: true
    },
    publishDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expiredDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    documentObtained: {
      type: DataTypes.DATE,
      allowNull: true
    },
    issuingAgency: {
      type: DataTypes.STRING,
      allowNull: true
    },
    originDocument: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    physicalLocation: {
      type: DataTypes.STRING,
      allowNull: true
    },
    physicalLocationDetail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    previousOwner: {
      type: DataTypes.STRING,
      allowNull: true
    },
    company: {
      type: DataTypes.ENUM('JH', 'JHT', 'BEP', 'PIJ'),
      allowNull: true
    },
    permitNumber: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'SubDocument',
    paranoid: true // Enables soft deletes
  });

  return SubDocument;
};