import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsPhoneNumber, IsString, MinLength } from 'class-validator';

@InputType()
export class SuperAdminInput {
  @Field()
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  @Field()
  @IsNotEmpty({ message: '手机号不能为空' })
  @IsPhoneNumber('CN', { message: '请输入有效的手机号' })
  phone: string;

  @Field()
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(6, { message: '密码长度不能少于6位' })
  password: string;
} 