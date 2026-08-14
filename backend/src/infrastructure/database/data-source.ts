import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/modules/**/infrastructure/entities/*.orm-entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
  // "each" (em vez do padrão "all") roda cada migração em sua própria transação,
  // permitindo que migrações individuais optem por `transaction = false` quando
  // precisam (ex.: CREATE INDEX CONCURRENTLY, que não pode rodar dentro de uma
  // transação) - o modo "all" proíbe esse override e falha com
  // ForbiddenTransactionModeOverrideError.
  migrationsTransactionMode: 'each',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
