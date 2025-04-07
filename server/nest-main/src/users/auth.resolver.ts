import { Args, Field, Mutation, ObjectType, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { CreateUserInput } from './dto/create-user.input';
import { LoginInput } from './dto/login.input';
import { User } from './entities/user.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => User)
  async register(@Args('input') createUserInput: CreateUserInput): Promise<User> {
    return this.authService.register(createUserInput);
  }

  @Mutation(() => LoginResponse)
  async login(@Args('input') loginInput: LoginInput): Promise<LoginResponse> {
    return this.authService.login(loginInput);
  }
}

@ObjectType()
class LoginResponse {
  @Field()
  token: string;

  @Field(() => User)
  user: User;
} 