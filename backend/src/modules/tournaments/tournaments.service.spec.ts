import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TournamentsService } from './tournaments.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionsService } from '../../transactions/transactions.service';
import { PrizePoolService } from '../prize-pool/prize-pool.service';
import { PlayerRestrictionsService } from '../../moderation/player-restrictions.service';
import { MatchesService } from '../matches/matches.service';
import { DrawRuleMode, TieBreakPolicy, TournamentStatus } from '@prisma/client';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { TOURNAMENT_VALIDATION_ERRORS } from './tournament-validation.constants';

describe('TournamentsService - Phase 6.0.D.2', () => {
  let service: TournamentsService;

  const mockPrismaService = {
    tournament: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockTransactionsService = {};
  const mockPrizePoolService = {};
  const mockPlayerRestrictionsService = {};
  const mockMatchesService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TournamentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TransactionsService, useValue: mockTransactionsService },
        { provide: PrizePoolService, useValue: mockPrizePoolService },
        { provide: PlayerRestrictionsService, useValue: mockPlayerRestrictionsService },
        { provide: MatchesService, useValue: mockMatchesService },
      ],
    }).compile();

    service = module.get<TournamentsService>(TournamentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTournamentAsAdmin - Phase 6.0.D.2', () => {
    const baseDto: CreateTournamentDto = {
      name: 'Test Tournament',
      timeControl: '10+0',
      buyInCents: 1000,
      minPlayers: 2,
      maxPlayers: 8,
      legalZoneCode: 'EU',
    };

    it('devrait rejeter requiresDecisiveResult=true avec tieBreakPolicy=NONE', async () => {
      const dto: CreateTournamentDto = {
        ...baseDto,
        requiresDecisiveResult: true,
        tieBreakPolicy: TieBreakPolicy.NONE,
      };

      await expect(service.createTournamentAsAdmin(dto, 'admin-id')).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.createTournamentAsAdmin(dto, 'admin-id')).rejects.toThrow(
        TOURNAMENT_VALIDATION_ERRORS.REQUIRES_DECISIVE_RESULT_WITHOUT_TIEBREAK,
      );

      expect(mockPrismaService.tournament.create).not.toHaveBeenCalled();
    });

    it('devrait rejeter drawRuleMode=NO_DRAW avec tieBreakPolicy=NONE', async () => {
      const dto: CreateTournamentDto = {
        ...baseDto,
        drawRuleMode: DrawRuleMode.NO_DRAW,
        tieBreakPolicy: TieBreakPolicy.NONE,
      };

      await expect(service.createTournamentAsAdmin(dto, 'admin-id')).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.createTournamentAsAdmin(dto, 'admin-id')).rejects.toThrow(
        TOURNAMENT_VALIDATION_ERRORS.NO_DRAW_WITHOUT_TIEBREAK,
      );

      expect(mockPrismaService.tournament.create).not.toHaveBeenCalled();
    });

    it('devrait accepter requiresDecisiveResult=true avec tieBreakPolicy=ARMAGEDDON', async () => {
      const dto: CreateTournamentDto = {
        ...baseDto,
        requiresDecisiveResult: true,
        tieBreakPolicy: TieBreakPolicy.ARMAGEDDON,
      };

      mockPrismaService.tournament.create.mockResolvedValue({
        id: 'tournament-id',
        ...dto,
        status: TournamentStatus.DRAFT,
        drawRuleMode: DrawRuleMode.ALLOW_ALL,
        requiresDecisiveResult: true,
        tieBreakPolicy: TieBreakPolicy.ARMAGEDDON,
        tieBreakTimeControl: null,
        drawConfig: null,
      });

      const result = await service.createTournamentAsAdmin(dto, 'admin-id');

      expect(result).toBeDefined();
      expect(mockPrismaService.tournament.create).toHaveBeenCalled();
    });

    it('devrait accepter drawRuleMode=NO_DRAW avec tieBreakPolicy=RAPID', async () => {
      const dto: CreateTournamentDto = {
        ...baseDto,
        drawRuleMode: DrawRuleMode.NO_DRAW,
        tieBreakPolicy: TieBreakPolicy.RAPID,
      };

      mockPrismaService.tournament.create.mockResolvedValue({
        id: 'tournament-id',
        ...dto,
        status: TournamentStatus.DRAFT,
        drawRuleMode: DrawRuleMode.NO_DRAW,
        requiresDecisiveResult: false,
        tieBreakPolicy: TieBreakPolicy.RAPID,
        tieBreakTimeControl: null,
        drawConfig: null,
      });

      const result = await service.createTournamentAsAdmin(dto, 'admin-id');

      expect(result).toBeDefined();
      expect(mockPrismaService.tournament.create).toHaveBeenCalled();
    });
  });

  describe('updateTournamentAsAdmin - Phase 6.0.D.2', () => {
    const existingTournament = {
      id: 'tournament-id',
      name: 'Existing Tournament',
      drawRuleMode: DrawRuleMode.ALLOW_ALL,
      tieBreakPolicy: TieBreakPolicy.NONE,
      requiresDecisiveResult: false,
      status: TournamentStatus.DRAFT,
      entries: [],
      timeControl: '10+0',
      buyInCents: 1000,
      currency: 'EUR',
      minPlayers: 2,
      maxPlayers: 8,
      legalZoneCode: 'EU',
    };

    beforeEach(() => {
      mockPrismaService.tournament.findUnique.mockResolvedValue(existingTournament);
    });

    it('devrait rejeter update partiel : requiresDecisiveResult=true alors que DB tieBreakPolicy=NONE', async () => {
      const dto: UpdateTournamentDto = {
        requiresDecisiveResult: true,
        // tieBreakPolicy non envoyé (reste NONE depuis DB)
      };

      await expect(service.updateTournamentAsAdmin('tournament-id', dto)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.updateTournamentAsAdmin('tournament-id', dto)).rejects.toThrow(
        TOURNAMENT_VALIDATION_ERRORS.REQUIRES_DECISIVE_RESULT_WITHOUT_TIEBREAK,
      );

      expect(mockPrismaService.tournament.update).not.toHaveBeenCalled();
    });

    it('devrait rejeter update partiel : drawRuleMode=NO_DRAW alors que DB tieBreakPolicy=NONE', async () => {
      const dto: UpdateTournamentDto = {
        drawRuleMode: DrawRuleMode.NO_DRAW,
        // tieBreakPolicy non envoyé (reste NONE depuis DB)
      };

      await expect(service.updateTournamentAsAdmin('tournament-id', dto)).rejects.toThrow(
        BadRequestException,
      );

      await expect(service.updateTournamentAsAdmin('tournament-id', dto)).rejects.toThrow(
        TOURNAMENT_VALIDATION_ERRORS.NO_DRAW_WITHOUT_TIEBREAK,
      );

      expect(mockPrismaService.tournament.update).not.toHaveBeenCalled();
    });

    it('devrait accepter update partiel : requiresDecisiveResult=true avec tieBreakPolicy=ARMAGEDDON', async () => {
      const dto: UpdateTournamentDto = {
        requiresDecisiveResult: true,
        tieBreakPolicy: TieBreakPolicy.ARMAGEDDON,
      };

      mockPrismaService.tournament.update.mockResolvedValue({
        ...existingTournament,
        ...dto,
      });

      const result = await service.updateTournamentAsAdmin('tournament-id', dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.tournament.update).toHaveBeenCalled();
    });

    it('devrait accepter update partiel : drawRuleMode=NO_DRAW avec tieBreakPolicy=RAPID', async () => {
      const dto: UpdateTournamentDto = {
        drawRuleMode: DrawRuleMode.NO_DRAW,
        tieBreakPolicy: TieBreakPolicy.RAPID,
      };

      mockPrismaService.tournament.update.mockResolvedValue({
        ...existingTournament,
        ...dto,
      });

      const result = await service.updateTournamentAsAdmin('tournament-id', dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.tournament.update).toHaveBeenCalled();
    });
  });
});
