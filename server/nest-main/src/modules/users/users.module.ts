import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';

import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserService } from './user.service';
import { UserGrpcController } from './user.grpc.controller';
import { UserHttpController } from './user.http.controller';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [
    UserGrpcController,
    UserHttpController,
  ],
  providers: [
    AuthService, 
    JwtStrategy,
    UserService,
  ],
  exports: [
    AuthService,
    UserService,
  ],
})
export class UsersModule {}