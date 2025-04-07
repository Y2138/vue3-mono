import { Field, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from './role.entity';

@ObjectType()
@Entity('permissions')
export class Permission {
  @Field(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column({ length: 50, unique: true })
  name: string;

  @Field(() => String)
  @Column({ length: 50 })
  action: string;

  @Field(() => String)
  @Column({ length: 50 })
  resource: string;

  @Field(() => String, { nullable: true })
  @Column({ length: 200, nullable: true })
  description: string;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];
} 