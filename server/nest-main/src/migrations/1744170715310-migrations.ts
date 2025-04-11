import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1744170715310 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 添加 email 列并设置非空约束
        await queryRunner.query(`ALTER TABLE users ADD COLUMN email character varying NOT NULL DEFAULT 'default@example.com'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 移除 email 列
        await queryRunner.query(`ALTER TABLE users DROP COLUMN email`);
    }

}
