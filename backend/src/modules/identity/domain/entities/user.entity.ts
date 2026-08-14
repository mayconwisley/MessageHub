import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { UserRole } from '../enums/user-role.enum';
import { UserStatus } from '../enums/user-status.enum';
import { InvalidUserNameError } from '../errors/invalid-user-name.error';
import { InvalidUserEmailError } from '../errors/invalid-user-email.error';
import { InvalidUserTenantAssignmentError } from '../errors/invalid-user-tenant-assignment.error';

export interface UserProps {
  tenantId: string | null;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}

export interface CreateUserParams {
  tenantId?: string | null;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UpdateUserProfileParams {
  name?: string;
  email?: string;
  role?: UserRole;
  tenantId?: string | null;
}

/** Sessão administrativa: limite de tentativas de senha antes de bloquear temporariamente a conta (secao 27). */
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60_000;

export class User extends Entity<UserProps> {
  private constructor(props: UserProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    params: CreateUserParams,
    id?: UniqueId,
  ): Result<User, InvalidUserNameError | InvalidUserEmailError | InvalidUserTenantAssignmentError> {
    const name = params.name?.trim();
    if (!name) {
      return Result.fail(new InvalidUserNameError());
    }
    const email = params.email?.trim().toLowerCase();
    if (!email) {
      return Result.fail(new InvalidUserEmailError());
    }
    const tenantId = params.tenantId ?? null;
    if (params.role !== UserRole.PLATFORM_ADMIN && !tenantId) {
      return Result.fail(new InvalidUserTenantAssignmentError());
    }

    const now = new Date();
    return Result.ok(
      new User(
        {
          tenantId,
          name,
          email,
          passwordHash: params.passwordHash,
          role: params.role,
          status: UserStatus.ACTIVE,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: null,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        id,
      ),
    );
  }

  static reconstitute(props: UserProps, id: UniqueId): User {
    return new User(props, id);
  }

  get tenantId(): string | null {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get failedLoginAttempts(): number {
    return this.props.failedLoginAttempts;
  }

  get lockedUntil(): Date | null {
    return this.props.lockedUntil;
  }

  isActive(): boolean {
    return this.props.status === UserStatus.ACTIVE;
  }

  isLocked(now: Date = new Date()): boolean {
    return this.props.lockedUntil !== null && this.props.lockedUntil > now;
  }

  /** Incrementa tentativas falhas; ao atingir o limite, bloqueia a conta e zera o contador. */
  recordFailedLogin(now: Date = new Date()): void {
    this.props.failedLoginAttempts += 1;
    if (this.props.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
      this.props.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
      this.props.failedLoginAttempts = 0;
    }
    this.touch();
  }

  resetFailedLogin(): void {
    this.props.failedLoginAttempts = 0;
    this.props.lockedUntil = null;
    this.touch();
  }

  suspend(): void {
    this.props.status = UserStatus.SUSPENDED;
    this.touch();
  }

  activate(): void {
    this.props.status = UserStatus.ACTIVE;
    this.touch();
  }

  recordLogin(): void {
    this.props.lastLoginAt = new Date();
    this.touch();
  }

  updateProfile(
    params: UpdateUserProfileParams,
  ): Result<void, InvalidUserNameError | InvalidUserEmailError | InvalidUserTenantAssignmentError> {
    if (params.name !== undefined) {
      const name = params.name.trim();
      if (!name) {
        return Result.fail(new InvalidUserNameError());
      }
      this.props.name = name;
    }
    if (params.email !== undefined) {
      const email = params.email.trim().toLowerCase();
      if (!email) {
        return Result.fail(new InvalidUserEmailError());
      }
      this.props.email = email;
    }
    const nextRole = params.role ?? this.props.role;
    const nextTenantId = params.tenantId !== undefined ? params.tenantId : this.props.tenantId;
    if (nextRole !== UserRole.PLATFORM_ADMIN && !nextTenantId) {
      return Result.fail(new InvalidUserTenantAssignmentError());
    }
    if (params.role !== undefined) {
      this.props.role = params.role;
    }
    if (params.tenantId !== undefined) {
      this.props.tenantId = params.tenantId;
    }
    this.touch();
    return Result.ok(undefined);
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
