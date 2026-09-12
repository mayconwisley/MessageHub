import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

const isCompiledRuntime = __filename.endsWith('.js');
const sourceRoot = isCompiledRuntime ? 'dist' : 'src';
const sourceExtension = isCompiledRuntime ? 'js' : 'ts';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [`${sourceRoot}/modules/**/infrastructure/entities/*.orm-entity.${sourceExtension}`],
  migrations: [`${sourceRoot}/infrastructure/database/migrations/*.${sourceExtension}`],
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
