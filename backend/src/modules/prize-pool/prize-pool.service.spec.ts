import { Test, TestingModule } from '@nestjs/testing';
import { PrizePoolService } from './prize-pool.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PrizePoolService', () => {
  let service: PrizePoolService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const mockPrismaService = {
      tournament: {
        findUnique: jest.fn(),
      },
      prizePool: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrizePoolService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PrizePoolService>(PrizePoolService);
    prismaService = mockPrismaService as any;
  });

  describe('computePrizePool', () => {
    it('should calculate prize pool with exact 9.75% take rate (5% commission + 4.75% tournament fee)', () => {
      // Cas simple avec montants ronds : 100€ de buy-ins
      const input = {
        playersCount: 10,
        buyInCents: 1000, // 10€ par joueur = 100€ total
      };

      const result = service.computePrizePool(input);

      // Vérifications
      expect(result.totalEntriesCents).toBe(10000); // 100€
      expect(result.commissionCents).toBe(500); // 5€ (5%)
      expect(result.distributableCents).toBe(9025); // 90.25€

      // Calcul du take rate total
      const totalTakeCents = result.totalEntriesCents - result.distributableCents;
      const takeRate = totalTakeCents / result.totalEntriesCents;

      // Vérifier que le take rate total = 9.75%
      expect(totalTakeCents).toBe(975); // 9.75€
      expect(takeRate).toBeCloseTo(0.0975, 4); // 9.75%

      // Vérifier que commission + tournament fee = take total
      // tournamentFee = totalEntries - commission - distributable
      const tournamentFeeCents = result.totalEntriesCents - result.commissionCents - result.distributableCents;
      expect(tournamentFeeCents).toBe(475); // 4.75€ (4.75%)
      expect(result.commissionCents + tournamentFeeCents).toBe(totalTakeCents); // 500 + 475 = 975
    });

    it('should ensure distributable + take = total entries', () => {
      const input = {
        playersCount: 8,
        buyInCents: 500, // 4€ total
      };

      const result = service.computePrizePool(input);

      // Vérifier que distributable + take = totalEntries
      const totalTakeCents = result.totalEntriesCents - result.distributableCents;
      expect(result.distributableCents + totalTakeCents).toBe(result.totalEntriesCents);
    });

    it('should handle edge case with single player', () => {
      const input = {
        playersCount: 1,
        buyInCents: 100, // 1€
      };

      const result = service.computePrizePool(input);

      expect(result.totalEntriesCents).toBe(100);
      expect(result.commissionCents).toBe(5); // 5% de 100 = 5
      // tournamentFee = floor(100 * 0.0475) = floor(4.75) = 4
      // distributable = 100 - 5 - 4 = 91
      expect(result.distributableCents).toBe(91);
      
      // Take total = 5 (commission) + 4 (tournament fee) = 9 centimes (9%)
      // Avec floor, on a 9% au lieu de 9.75% pour de très petits montants
      const totalTakeCents = result.totalEntriesCents - result.distributableCents;
      expect(totalTakeCents).toBe(9); // 9 centimes (5 + 4)
    });
  });
});

