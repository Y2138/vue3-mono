import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from './prisma.service';

export const PRISMA_CLIENT = 'PRISMA_CLIENT';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: PRISMA_CLIENT,
      useFactory: () => new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
      }),
    },
  ],
  exports: [PrismaService, PRISMA_CLIENT],
})
export class PrismaModule {}