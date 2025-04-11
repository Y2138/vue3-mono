import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { CreateUserInput } from './dto/create-user.input';
import { LoginInput } from './dto/login.input';
import { User } from './entities/user.entity';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth-response';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../rbac/guards/gql-auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermissions } from '../rbac/decorators/require-permissions.decorator';
import { ACTIONS, RESOURCES } from '../rbac/seeds/initial-data';
import { SuperAdminInput } from './dto/super-admin.input';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async register(@Args('input') registerInput: RegisterInput) {
    return this.authService.register(registerInput);
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input') loginInput: LoginInput) {
    return this.authService.login(loginInput);
  }

  @Mutation(() => AuthResponse)
  @UseGuards(GqlAuthGuard, PermissionGuard)
  @RequirePermissions(`${RESOURCES.SYSTEM}:${ACTIONS.MANAGE}`)
  async createSuperAdmin(@Args('input') input: SuperAdminInput) {
    return this.authService.createSuperAdmin(input);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, PermissionGuard)
  @RequirePermissions(`${RESOURCES.SYSTEM}:${ACTIONS.MANAGE}`)
  async promoteToSuperAdmin(@Args('phone') phone: string) {
    return this.authService.promoteToSuperAdmin(phone);
  }
}

@ObjectType()
class LoginResponse {
  @Field()
  token: string;

  @Field(() => User)
  user: User;
} 