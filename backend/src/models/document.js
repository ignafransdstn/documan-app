const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Document extends Model {
    static associate(models) {
      Document.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
      Document.hasMany(models.SubDocument, {
        foreignKey: 'parentDocumentId',
        as: 'subDocuments'
      });
    }
  }

  Document.init({
    documentNo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
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
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {}
    },
    // New certificate and property fields
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
    originDocument: {
      type: DataTypes.TEXT,
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
    formSubmissionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'FormSubmissions',
        key: 'id'
      }
    },
    generatedFromForm: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'Document',
    paranoid: true // Enables soft deletes
  });

  return Document;
};