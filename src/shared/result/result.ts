export class Result<TValue, TError = Error> {
  private readonly _isSuccess: boolean;
  private readonly _value?: TValue;
  private readonly _error?: TError;

  private constructor(isSuccess: boolean, value?: TValue, error?: TError) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): TValue {
    if (!this._isSuccess) {
      throw new Error('Cannot read the value of a failed Result.');
    }
    return this._value as TValue;
  }

  get error(): TError {
    if (this._isSuccess) {
      throw new Error('Cannot read the error of a successful Result.');
    }
    return this._error as TError;
  }

  static ok<TValue, TError = Error>(value: TValue): Result<TValue, TError> {
    return new Result<TValue, TError>(true, value, undefined);
  }

  static fail<TValue = void, TError = Error>(error: TError): Result<TValue, TError> {
    return new Result<TValue, TError>(false, undefined, error);
  }
}
