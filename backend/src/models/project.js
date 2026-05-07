const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Project extends Model {
    static associate(models) {
      Project.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
      Project.hasMany(models.ProjectDocument, { foreignKey: 'projectId', as: 'linkedDocuments' });
      Project.hasMany(models.ProjectSupportingDocument, { foreignKey: 'projectId', as: 'supportingDocuments' });
    }
  }

  Project.init({
    type: {
      type: DataTypes.ENUM('project', 'dispute'),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'on_hold'),
      allowNull: false,
      defaultValue: 'active'
    },
    institution: {
      type: DataTypes.ENUM('POLSEK', 'POLRES', 'POLDA', 'KEJATI', 'KEJARI', 'KEJAGUNG', 'MA', 'MK', 'OTHERS'),
      allowNull: true
    },
    institutionDetail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    estimatedEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    actualEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Project',
    tableName: 'Projects',
    timestamps: true
  });

  return Project;
};
