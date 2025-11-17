import { IsArray, IsString } from 'class-validator';

export class AssignResourcesDto {
  @IsString()
  roleId: string;

  @IsArray()
  @IsString({ each: true })
  resourceIds: string[];
}