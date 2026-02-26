import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { dbQueryDuration, dbQueryTotal } from './metrics';

dotenv.config();

const isDevelopment = process.env.NODE_ENV === 'development';

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gamevault',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  // Custom logging hook: measure every query for Prometheus metrics
  logging: (sql: string, timing?: number) => {
    const op = extractOperation(sql);
    dbQueryTotal.inc({ operation: op });
    if (typeof timing === 'number') {
      dbQueryDuration.observe({ operation: op }, timing / 1000); // ms → s
    }
  },
  benchmark: true, // enables the `timing` parameter above
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

/**
 * Extract the SQL operation keyword (SELECT, INSERT, UPDATE, DELETE …)
 * for use as a low-cardinality metric label.
 */
function extractOperation(sql: string): string {
  const match = sql.match(/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|BEGIN|COMMIT|ROLLBACK)/i);
  return match ? match[1].toUpperCase() : 'OTHER';
}

export default sequelize;
