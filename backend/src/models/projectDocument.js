const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ProjectDocument extends Model {
    static associate(models) {
      ProjectDocument.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
      ProjectDocument.belongsTo(models.Document, { foreignKey: 'documentId', as: 'document' });
      ProjectDocument.belongsTo(models.SubDocument, { foreignKey: 'subDocumentId', as: 'subDocument' });
    }
  }

  ProjectDocument.init({
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    documentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    subDocumentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    documentType: {
      type: DataTypes.ENUM('master', 'sub'),
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'ProjectDocument',
    tableName: 'ProjectDocuments',
    timestamps: true
  });

  return ProjectDocument;
};
