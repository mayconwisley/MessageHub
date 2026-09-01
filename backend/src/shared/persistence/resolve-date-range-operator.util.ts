import { Between, FindOperator, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

/** Traduz um intervalo `createdFrom`/`createdTo` no operador TypeORM equivalente, para uso em `FindOptionsWhere`. */
export function resolveDateRangeOperator(from?: Date, to?: Date): FindOperator<Date> | undefined {
  if (from && to) return Between(from, to);
  if (from) return MoreThanOrEqual(from);
  if (to) return LessThanOrEqual(to);
  return undefined;
}
