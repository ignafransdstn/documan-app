module.exports = (sequelize, DataTypes) => {
  const Form = sequelize.define(
    'Form',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      originalFile: {
        type: DataTypes.BLOB,
        allowNull: false
      },
      status: {
        type: DataTypes.ENUM('active', 'archived', 'deleted'),
        defaultValue: 'active'
      },
      createdBy: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: 'Forms',
      timestamps: true
    }
  );

  Form.associate = (models) => {
    Form.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Form.hasMany(models.FormField, { foreignKey: 'formId', as: 'fields' });
    Form.hasMany(models.FormSubmission, { foreignKey: 'formId', as: 'submissions' });
  };

  return Form;
};
