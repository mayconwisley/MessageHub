import { Module } from '@nestjs/common';
import { SandboxMessageProvider } from './services/sandbox-message.provider';

@Module({ providers: [SandboxMessageProvider], exports: [SandboxMessageProvider] })
export class SandboxModule {}
