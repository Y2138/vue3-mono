import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Role } from '../rbac/entities/role.entity';
import { UserGrpcController } from './user.grpc.controller';
import { UserHttpController } from './user.http.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
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
  ],
  exports: [
    AuthService,
  ],
})
export class UsersModule {} 