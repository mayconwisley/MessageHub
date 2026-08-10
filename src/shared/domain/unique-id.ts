import { randomUUID } from 'crypto';

export class UniqueId {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other?: UniqueId): boolean {
    return !!other && other._value === this._value;
  }

  toString(): string {
    return this._value;
  }

  static create(value?: string): UniqueId {
    return new UniqueId(value ?? randomUUID());
  }
}
