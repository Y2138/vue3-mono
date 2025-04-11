import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../rbac/entities/role.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => String)
  @PrimaryColumn()
  phone: string;

  @Field()
  @Column()
  username: string;

  @Column()
  password: string;

  @Field()
  @Column({ default: false })
  isActive: boolean;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'phone' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  @Field(() => [Role])
  roles: Role[];
} 