require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'relatorios',
    password: process.env.DB_PASSWORD || 'relatorios123',
    database: process.env.DB_NAME || 'relatorios',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    dialect: 'mysql',
    logging: false,
    timezone: '-03:00',
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  test: {
    username: process.env.DB_USER || 'relatorios',
    password: process.env.DB_PASSWORD || 'relatorios123',
    database: process.env.DB_NAME + '_test' || 'relatorios_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3307'),
    dialect: 'mysql',
    logging: false,
    timezone: '-03:00',
    define: {
      timestamps: true,
      underscored: true,
    },
  },
  production: {
    username: process.env.DB_USER || 'relatorios',
    password: process.env.DB_PASSWORD || 'relatorios123',
    database: process.env.DB_NAME || 'relatorios',
    host: process.env.DB_HOST || 'mysql',
    port: parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false,
    timezone: '-03:00',
    define: {
      timestamps: true,
      underscored: true,
    },
  },
};
