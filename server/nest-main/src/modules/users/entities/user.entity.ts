import { Field, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../rbac/entities/role.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => String)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String)
  @Column({ length: 100, unique: true })
  email: string;

  @Column()
  password: string;

  @Field(() => String)
  @Column({ length: 50 })
  firstName: string;

  @Field(() => String)
  @Column({ length: 50 })
  lastName: string;

  @Field(() => Boolean)
  @Column({ default: true })
  isActive: boolean;

  @Field(() => Date)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Role, role => role.users, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  @Field(() => [Role])
  roles: Role[];
} 