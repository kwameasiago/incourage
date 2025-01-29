import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT) || 5432,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,


  entities: process.env.NODE_ENV === 'production' 
    ? ['dist/**/*.entity.js'] 
    : ['src/**/*.entity.ts'], 

  migrationsTableName: 'migration',


  migrations: process.env.NODE_ENV === 'production' 
    ? ['dist/migration/**/*.js'] 
    : ['src/migration/**/*.ts'], 

  synchronize: false, 
  logging: true,
});

export default AppDataSource;
