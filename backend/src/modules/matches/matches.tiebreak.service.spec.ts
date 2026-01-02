import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TournamentsService } from '../tournaments/tournaments.service';
import { ChessEngineService } from './chess-engine.service';
import {
  MatchStatus,
  MatchResult,
  TieBreakPolicy,
  DrawRuleMode,
} from '@prisma/client';
import { RESULT_REASON_TIEBREAK_PENDING } from './match.constants';

describe('MatchesService - Phase 6.0.D.3 (Tie-Break Creation)', () => {
  let service: MatchesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    match: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    tournament: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockTransaction)),
  };

  const mockTransaction = {
    match: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    tournament: {
      findUnique: jest.fn(),
    },
  };

  const mockTournamentsService = {};
  const mockChessEngineService = {};

  const mockParentMatchId = 'parent-match-123';
  const mockTournamentId = 'tournament-123';
  const mockWhiteEntryId = 'white-entry-123';
  const mockBlackEntryId = 'black-entry-123';

  const mockParentMatch = {
    id: mockParentMatchId,
    tournamentId: mockTournamentId,
    roundNumber: 1,
    boardNumber: 1,
    whiteEntryId: mockWhiteEntryId,
    blackEntryId: mockBlackEntryId,
    status: MatchStatus.FINISHED,
    result: MatchResult.DRAW,
    resultReason: RESULT_REASON_TIEBREAK_PENDING,
    isTieBreak: false,
    parentMatchId: null,
    tieBreakIndex: 0,
    tieBreakType: null,
    timeControlOverride: null,
    tournament: {
      id: mockTournamentId,
      tieBreakPolicy: TieBreakPolicy.RAPID,
      tieBreakTimeControl: '3+2',
      timeControl: '10+0',
    },
    whiteEntry: {
      id: mockWhiteEntryId,
      playerId: 'white-player-123',
    },
    blackEntry: {
      id: mockBlackEntryId,
      playerId: 'black-player-123',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TournamentsService, useValue: mockTournamentsService },
        { provide: ChessEngineService, useValue: mockChessEngineService },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTieBreakMatches', () => {
    it('devrait créer 1 match tie-break pour RAPID', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.RAPID,
        },
      });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'tiebreak-1',
        ...mockParentMatch,
        isTieBreak: true,
        parentMatchId: mockParentMatchId,
        tieBreakIndex: 1,
        tieBreakType: TieBreakPolicy.RAPID,
        timeControlOverride: '3+2',
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.findUnique).toHaveBeenCalledWith({
        where: { id: mockParentMatchId },
        include: expect.any(Object),
      });
      expect(mockPrismaService.match.create).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.match.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isTieBreak: true,
          parentMatchId: mockParentMatchId,
          tieBreakIndex: 1,
          tieBreakType: TieBreakPolicy.RAPID,
          timeControlOverride: '3+2',
        }),
      });
    });

    it('devrait créer 1 match tie-break pour BLITZ', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.BLITZ,
        },
      });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'tiebreak-1',
        isTieBreak: true,
        tieBreakIndex: 1,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).toHaveBeenCalledTimes(1);
    });

    it('devrait créer 1 match tie-break pour ARMAGEDDON avec inversion des couleurs', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.ARMAGEDDON,
        },
      });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'tiebreak-1',
        isTieBreak: true,
        tieBreakIndex: 1,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).toHaveBeenCalledTimes(1);
      // Vérifier que les couleurs sont inversées pour ARMAGEDDON
      expect(mockPrismaService.match.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          whiteEntryId: mockBlackEntryId, // Inversion
          blackEntryId: mockWhiteEntryId, // Inversion
          tieBreakType: TieBreakPolicy.ARMAGEDDON,
        }),
      });
    });

    it('devrait créer 3 matchs tie-break pour BEST_OF_3', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.BEST_OF_3,
        },
      });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'tiebreak-1',
        isTieBreak: true,
        tieBreakIndex: 1,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).toHaveBeenCalledTimes(3);
      expect(mockPrismaService.match.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          tieBreakIndex: 1,
        }),
      });
      expect(mockPrismaService.match.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          tieBreakIndex: 2,
        }),
      });
      expect(mockPrismaService.match.create).toHaveBeenNthCalledWith(3, {
        data: expect.objectContaining({
          tieBreakIndex: 3,
        }),
      });
    });

    it('devrait créer 5 matchs tie-break pour BEST_OF_5', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.BEST_OF_5,
        },
      });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'tiebreak-1',
        isTieBreak: true,
        tieBreakIndex: 1,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).toHaveBeenCalledTimes(5);
    });

    it('devrait être idempotent : ignorer P2002 (contrainte unique violée)', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.RAPID,
        },
      });

      // Simuler P2002 (contrainte unique violée) - tie-break déjà créé
      const p2002Error = new Error('Unique constraint failed');
      (p2002Error as any).code = 'P2002';
      mockPrismaService.match.create.mockRejectedValue(p2002Error);

      // Ne doit pas throw, juste ignorer
      await expect(
        service.createTieBreakMatches(mockParentMatchId),
      ).resolves.not.toThrow();

      expect(mockPrismaService.match.create).toHaveBeenCalled();
    });

    it('devrait throw si erreur autre que P2002', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.RAPID,
        },
      });

      const otherError = new Error('Database connection failed');
      (otherError as any).code = 'P2001';
      mockPrismaService.match.create.mockRejectedValue(otherError);

      await expect(
        service.createTieBreakMatches(mockParentMatchId),
      ).rejects.toThrow('Database connection failed');
    });

    it('devrait throw NotFoundException si match parent inexistant', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(
        service.createTieBreakMatches('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait no-op si match est déjà un tie-break', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        isTieBreak: true,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).not.toHaveBeenCalled();
    });

    it('devrait no-op si match n\'est pas DRAW', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        result: MatchResult.WHITE_WIN,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).not.toHaveBeenCalled();
    });

    it('devrait no-op si tieBreakPolicy = NONE', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.NONE,
        },
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).not.toHaveBeenCalled();
    });

    it('devrait utiliser tieBreakTimeControl si présent, sinon timeControl', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.RAPID,
          tieBreakTimeControl: '5+3', // Spécifique tie-break
          timeControl: '10+0',
        },
      });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'tiebreak-1',
        isTieBreak: true,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timeControlOverride: '5+3', // Doit utiliser tieBreakTimeControl
        }),
      });
    });

    it('devrait utiliser timeControl si tieBreakTimeControl absent', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.RAPID,
          tieBreakTimeControl: null,
          timeControl: '10+0',
        },
      });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'tiebreak-1',
        isTieBreak: true,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      expect(mockPrismaService.match.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          timeControlOverride: '10+0', // Doit utiliser timeControl
        }),
      });
    });

    it('devrait alterner les couleurs pour BEST_OF_3 (index pair = swap)', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          ...mockParentMatch.tournament,
          tieBreakPolicy: TieBreakPolicy.BEST_OF_3,
        },
      });

      mockPrismaService.match.create.mockResolvedValue({
        id: 'tiebreak-1',
        isTieBreak: true,
      });

      await service.createTieBreakMatches(mockParentMatchId);

      // Index 1 (impair) : mêmes couleurs que parent
      expect(mockPrismaService.match.create).toHaveBeenNthCalledWith(1, {
        data: expect.objectContaining({
          whiteEntryId: mockWhiteEntryId,
          blackEntryId: mockBlackEntryId,
          tieBreakIndex: 1,
        }),
      });

      // Index 2 (pair) : swap des couleurs
      expect(mockPrismaService.match.create).toHaveBeenNthCalledWith(2, {
        data: expect.objectContaining({
          whiteEntryId: mockBlackEntryId,
          blackEntryId: mockWhiteEntryId,
          tieBreakIndex: 2,
        }),
      });

      // Index 3 (impair) : mêmes couleurs que parent
      expect(mockPrismaService.match.create).toHaveBeenNthCalledWith(3, {
        data: expect.objectContaining({
          whiteEntryId: mockWhiteEntryId,
          blackEntryId: mockBlackEntryId,
          tieBreakIndex: 3,
        }),
      });
    });
  });

  describe('getActivePlayableMatchId - Phase 6.0.D.4', () => {
    it('devrait retourner matchId si match n\'est pas un parent avec tie-break pending', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        result: MatchResult.WHITE_WIN, // Pas DRAW
        tournament: {
          tieBreakPolicy: TieBreakPolicy.NONE,
        },
        tieBreakMatches: [],
      });

      const result = await (service as any).getActivePlayableMatchId(
        mockParentMatchId,
        'white-player-123',
      );

      expect(result).toBe(mockParentMatchId);
    });

    it('devrait retourner tieBreakId si parent a tie-break pending et tie-break actif existe', async () => {
      const activeTieBreak = {
        id: 'tiebreak-1',
        whiteEntryId: mockWhiteEntryId,
        blackEntryId: mockBlackEntryId,
      };

      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        result: MatchResult.DRAW,
        resultReason: RESULT_REASON_TIEBREAK_PENDING,
        tournament: {
          tieBreakPolicy: TieBreakPolicy.RAPID,
        },
        tieBreakMatches: [activeTieBreak],
      });

      const result = await (service as any).getActivePlayableMatchId(
        mockParentMatchId,
        'white-player-123',
      );

      expect(result).toBe('tiebreak-1');
    });

    it('devrait throw ForbiddenException si playerId n\'est pas autorisé', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          tieBreakPolicy: TieBreakPolicy.NONE,
        },
        tieBreakMatches: [],
      });

      try {
        await (service as any).getActivePlayableMatchId(
          mockParentMatchId,
          'other-player-123',
        );
        fail('Devrait throw ForbiddenException');
      } catch (err) {
        expect(err).toBeInstanceOf(ForbiddenException);
        expect(err.response.code).toBe('PLAYER_NOT_IN_MATCH');
      }
    });

    it('devrait throw NotFoundException si match inexistant', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue(null);

      await expect(
        (service as any).getActivePlayableMatchId('non-existent-id', 'white-player-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('devrait déclencher resolveTieBreak si tous les tie-breaks sont terminés mais parent pas mis à jour', async () => {
      const resolveTieBreakSpy = jest
        .spyOn(service as any, 'resolveTieBreak')
        .mockResolvedValue(undefined);

      mockPrismaService.match.findUnique
        .mockResolvedValueOnce({
          ...mockParentMatch,
          result: MatchResult.DRAW,
          resultReason: RESULT_REASON_TIEBREAK_PENDING,
          tournament: {
            tieBreakPolicy: TieBreakPolicy.RAPID,
          },
          tieBreakMatches: [], // Tous terminés
        })
        .mockResolvedValueOnce({
          ...mockParentMatch,
          result: MatchResult.DRAW, // Parent toujours en DRAW
        });

      const result = await (service as any).getActivePlayableMatchId(
        mockParentMatchId,
        'white-player-123',
      );

      expect(result).toBe(mockParentMatchId);
      expect(resolveTieBreakSpy).toHaveBeenCalledWith(mockParentMatchId);
    });

    it('devrait throw BadRequestException si match n\'a pas d\'entrées complètes (BYE)', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        whiteEntryId: null, // BYE
        blackEntryId: mockBlackEntryId,
        tournament: {
          tieBreakPolicy: TieBreakPolicy.NONE,
        },
        tieBreakMatches: [],
      });

      await expect(
        (service as any).getActivePlayableMatchId(mockParentMatchId, 'white-player-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('resolveTieBreak - Phase 6.0.D.4', () => {
    beforeEach(() => {
      // Mock pour generateNextRoundIfNeeded
      jest
        .spyOn(service as any, 'generateNextRoundIfNeeded')
        .mockResolvedValue(undefined);
    });

    it('devrait résoudre RAPID : winner direct', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          id: mockTournamentId,
          tieBreakPolicy: TieBreakPolicy.RAPID,
        },
        tieBreakMatches: [
          {
            result: MatchResult.WHITE_WIN,
            whiteEntryId: mockWhiteEntryId,
            blackEntryId: mockBlackEntryId,
          },
        ],
      });

      mockPrismaService.match.update.mockResolvedValue({
        ...mockParentMatch,
        result: MatchResult.WHITE_WIN,
        resultReason: 'TIE_BREAK_RAPID',
      });

      await service.resolveTieBreak(mockParentMatchId);

      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: mockParentMatchId },
        data: {
          result: MatchResult.WHITE_WIN,
          resultReason: 'TIE_BREAK_RAPID',
        },
      });
    });

    it('devrait résoudre ARMAGEDDON : noir gagne si nul', async () => {
      // Dans ARMAGEDDON, les couleurs sont inversées
      // Si DRAW dans le tie-break, noir du tie-break gagne
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          id: mockTournamentId,
          tieBreakPolicy: TieBreakPolicy.ARMAGEDDON,
        },
        tieBreakMatches: [
          {
            result: MatchResult.DRAW,
            whiteEntryId: mockBlackEntryId, // Inversion
            blackEntryId: mockWhiteEntryId, // Inversion
          },
        ],
      });

      mockPrismaService.match.update.mockResolvedValue({
        ...mockParentMatch,
        result: MatchResult.WHITE_WIN, // Blanc du parent gagne (noir du tie-break)
        resultReason: 'TIE_BREAK_ARMAGEDDON',
      });

      await service.resolveTieBreak(mockParentMatchId);

      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: mockParentMatchId },
        data: {
          result: MatchResult.WHITE_WIN,
          resultReason: 'TIE_BREAK_ARMAGEDDON',
        },
      });
    });

    it('devrait résoudre BEST_OF_3 : majorité de victoires', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          id: mockTournamentId,
          tieBreakPolicy: TieBreakPolicy.BEST_OF_3,
        },
        tieBreakMatches: [
          {
            result: MatchResult.WHITE_WIN,
            whiteEntryId: mockWhiteEntryId,
            blackEntryId: mockBlackEntryId,
          },
          {
            result: MatchResult.WHITE_WIN,
            whiteEntryId: mockWhiteEntryId,
            blackEntryId: mockBlackEntryId,
          },
          {
            result: MatchResult.BLACK_WIN,
            whiteEntryId: mockBlackEntryId, // Swap couleurs
            blackEntryId: mockWhiteEntryId, // Swap couleurs
          },
        ],
      });

      mockPrismaService.match.update.mockResolvedValue({
        ...mockParentMatch,
        result: MatchResult.WHITE_WIN,
        resultReason: 'TIE_BREAK_BEST_OF_3',
      });

      await service.resolveTieBreak(mockParentMatchId);

      expect(mockPrismaService.match.update).toHaveBeenCalledWith({
        where: { id: mockParentMatchId },
        data: {
          result: MatchResult.WHITE_WIN,
          resultReason: 'TIE_BREAK_BEST_OF_3',
        },
      });
    });

    it('devrait no-op si pas tous les tie-breaks sont terminés', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          id: mockTournamentId,
          tieBreakPolicy: TieBreakPolicy.BEST_OF_3,
        },
        tieBreakMatches: [
          {
            result: MatchResult.WHITE_WIN,
            whiteEntryId: mockWhiteEntryId,
            blackEntryId: mockBlackEntryId,
          },
          // Seulement 1 sur 3 terminés
        ],
      });

      await service.resolveTieBreak(mockParentMatchId);

      expect(mockPrismaService.match.update).not.toHaveBeenCalled();
    });

    it('devrait no-op si DRAW dans RAPID (cas edge)', async () => {
      mockPrismaService.match.findUnique.mockResolvedValue({
        ...mockParentMatch,
        tournament: {
          id: mockTournamentId,
          tieBreakPolicy: TieBreakPolicy.RAPID,
        },
        tieBreakMatches: [
          {
            result: MatchResult.DRAW,
            whiteEntryId: mockWhiteEntryId,
            blackEntryId: mockBlackEntryId,
          },
        ],
      });

      await service.resolveTieBreak(mockParentMatchId);

      expect(mockPrismaService.match.update).not.toHaveBeenCalled();
    });
  });

  describe('generateNextRoundIfNeeded - Phase 6.0.D.4 (Décision B3)', () => {
    beforeEach(() => {
      mockPrismaService.tournament.findUnique = jest.fn().mockResolvedValue({
        tieBreakPolicy: TieBreakPolicy.NONE,
      });
    });

    it('devrait return immédiatement si un parent est DRAW + TIEBREAK_PENDING', async () => {
      const parentWithTieBreak = {
        ...mockParentMatch,
        result: MatchResult.DRAW,
        resultReason: RESULT_REASON_TIEBREAK_PENDING,
        status: MatchStatus.FINISHED,
        isTieBreak: false,
        tournament: {
          tieBreakPolicy: TieBreakPolicy.RAPID,
        },
      };

      mockPrismaService.match.findMany.mockResolvedValue([
        parentWithTieBreak,
        {
          ...mockParentMatch,
          id: 'match-2',
          result: MatchResult.WHITE_WIN,
          status: MatchStatus.FINISHED,
          isTieBreak: false,
          tournament: {
            tieBreakPolicy: TieBreakPolicy.NONE,
          },
        },
      ]);

      await service.generateNextRoundIfNeeded(mockTournamentId);

      // Ne doit pas créer de nouvelle ronde
      expect(mockPrismaService.match.create).not.toHaveBeenCalled();
    });
  });
});

