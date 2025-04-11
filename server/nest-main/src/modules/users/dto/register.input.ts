import { Field, InputType } from '@nestjs/graphql';
import { IsString, Length, Matches } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入正确的手机号格式' })
  phone: string;

  @Field()
  @IsString()
  @Length(2, 20, { message: '用户名长度必须在2-20个字符之间' })
  username: string;

  @Field()
  @IsString()
  @Length(6, 30, { message: '密码长度必须在6-30个字符之间' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: '密码必须包含大小写字母和数字',
  })
  password: string;
} 