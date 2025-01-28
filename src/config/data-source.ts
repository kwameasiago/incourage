import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'postgres', // Set the database type; adjust as needed for other databases
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10), // Default to 5432 if not specified
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false, // Recommended to be false in production
    migrationsTableName: 'migration',
    migrations: ['src/migration/**/*.ts'],
});