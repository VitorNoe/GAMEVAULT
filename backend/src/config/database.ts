import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gamevault',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  logging: isDevelopment ? false : false, // Desabilitar logs SQL para melhor performance
  pool: {
    max: isDevelopment ? 10 : 5, // Mais conexões em desenvolvimento
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  // Otimizações adicionais
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  },
  // Dialeto específico com otimizações
  dialectOptions: {
    statement_timeout: 30000, // 30 segundos
    idle_in_transaction_session_timeout: 30000
  }
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;
