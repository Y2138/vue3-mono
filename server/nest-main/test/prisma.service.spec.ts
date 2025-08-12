import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { PrismaModule } from '../src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from '../src/config/database.config';

describe('PrismaService', () => {
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
        }),
        PrismaModule,
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(prismaService).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return true when database is connected', async () => {
      // 模拟 $queryRaw 方法
      jest.spyOn(prismaService['prisma'], '$queryRaw').mockResolvedValueOnce([{ '1': 1 }]);
      
      const result = await prismaService.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when database connection fails', async () => {
      // 模拟 $queryRaw 方法抛出错误
      jest.spyOn(prismaService['prisma'], '$queryRaw').mockRejectedValueOnce(new Error('Connection failed'));
      
      const result = await prismaService.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('client', () => {
    it('should return extended prisma client', () => {
      const client = prismaService.client;
      expect(client).toBeDefined();
    });
  });
});
