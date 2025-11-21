const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    ...dbConfig.dialectOptions
  }
);

const modelDefiners = [
  require('./user'),
  require('./document'),
  require('./subDocument'),
  require('./activityLog')
];

// Initialize models
for (const modelDefiner of modelDefiners) {
  modelDefiner(sequelize);
}

// Apply associations
Object.keys(sequelize.models)
  .forEach(modelName => {
    if (sequelize.models[modelName].associate) {
      sequelize.models[modelName].associate(sequelize.models);
    }
  });

module.exports = {
  sequelize,
  ...sequelize.models
};