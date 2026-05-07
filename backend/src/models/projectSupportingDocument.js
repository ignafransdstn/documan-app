const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectSupportingDocument extends Model {
    static associate(models) {
      ProjectSupportingDocument.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
      ProjectSupportingDocument.belongsTo(models.User, { foreignKey: 'uploadedBy', as: 'uploader' });
    }
  }

  ProjectSupportingDocument.init({
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ProjectSupportingDocument',
    tableName: 'ProjectSupportingDocuments',
    timestamps: true
  });

  return ProjectSupportingDocument;
};
