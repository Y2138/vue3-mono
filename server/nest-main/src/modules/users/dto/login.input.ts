import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsPhoneNumber, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field()
  @IsNotEmpty()
  @IsPhoneNumber('CN')
  phone: string;

  @Field()
  @MinLength(6)
  password: string;
} 