import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'relatorios',
  username: process.env.DB_USER || 'relatorios',
  password: process.env.DB_PASSWORD || 'relatorios123',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  timezone: '-03:00',
  dialectOptions: {
    connectTimeout: 60000,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
