module.exports = (sequelize, DataTypes) => {
  const FormField = sequelize.define(
    'FormField',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      formId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      fieldName: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      fieldType: {
        type: DataTypes.ENUM('text', 'date', 'number', 'select', 'textarea'),
        defaultValue: 'text'
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      placeholder: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      validationRules: {
        type: DataTypes.JSON,
        allowNull: true
      },
      displayOrder: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: 'FormFields',
      timestamps: true
    }
  );

  FormField.associate = (models) => {
    FormField.belongsTo(models.Form, { foreignKey: 'formId' });
  };

  return FormField;
};
