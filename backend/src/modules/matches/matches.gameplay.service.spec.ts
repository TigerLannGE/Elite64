import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TournamentsService } from '../tournaments/tournaments.service';
import { ChessEngineService } from './chess-engine.service';
import { MatchStatus, MatchResult, MatchColor, TieBreakPolicy, DrawRuleMode } from '@prisma/client';
import { RESULT_REASON_TIEBREAK_PENDING } from './match.constants';

describe('MatchesService - Gameplay (Phase 6.0.C)', () => {
  let service: MatchesService;
  let prismaService: any;
  let tournamentsService: any;
  let chessEngineService: ChessEngineService;
  let mockTransaction: any;

  const mockMatchId = 'match-123';
  const mockTournamentId = 'tournament-123';
  const mockWhitePlayerId = 'white-player-123';
  const mockBlackPlayerId = 'black-player-123';
  const mockWhiteEntryId = 'white-entry-123';
  const mockBlackEntryId = 'black-entry-123';

  const mockMatch = {
    id: mockMatchId,
    tournamentId: mockTournamentId,
    roundNumber: 1,
    boardNumber: 1,
    whiteEntryId: mockWhiteEntryId,
    blackEntryId: mockBlackEntryId,
    status: MatchStatus.PENDING,
    result: null,
    resultReason: null,
    startedAt: null,
    finishedAt: null,
    initialFen: null,
    currentFen: null,
    whiteTimeMsRemaining: null,
    blackTimeMsRemaining: null,
    lastMoveAt: null,
    readyAt: null,
    whiteJoinedAt: null,
    blackJoinedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    whiteEntry: {
      id: mockWhiteEntryId,
      playerId: mockWhitePlayerId,
      player: {
        id: mockWhitePlayerId,
      },
    },
    blackEntry: {
      id: mockBlackEntryId,
      playerId: mockBlackPlayerId,
      player: {
        id: mockBlackPlayerId,
      },
    },
    tournament: {
      id: mockTournamentId,
      timeControl: '10+0',
    },
    moves: [],
  };

  beforeEach(async () => {
    // Créer un mock transaction qui sera utilisé dans $transaction
    const createMockTransaction = () => ({
      match: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      matchMove: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      tournament: {
        findUnique: jest.fn(),
      },
    });

    // Variable pour stocker le mock transaction actuel
    let currentMockTransaction = createMockTransaction();

    // Mock pour getActivePlayableMatchId() - Phase 6.0.D.4
    // Dans les tests gameplay, on mocke pour qu'il retourne simplement le matchId
    // (ces tests ne testent pas la redirection tie-break)

    const mockPrismaService = {
      match: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
      matchMove: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => {
        // Utiliser le mock transaction actuel (peut être modifié par les tests)
        return callback(currentMockTransaction);
      }),
      // Méthode pour obtenir le mock transaction actuel
      getTransactionMock: () => currentMockTransaction,
      // Méthode pour réinitialiser le mock transaction
      resetTransactionMock: () => {
        currentMockTransaction = createMockTransaction();
      },
    };

    const mockTournamentsService = {
      finalizeTournamentAndPayouts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TournamentsService,
          useValue: mockTournamentsService,
        },
        ChessEngineService,
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
    prismaService = mockPrismaService;
    tournamentsService = mockTournamentsService;
    chessEngineService = module.get<ChessEngineService>(ChessEngineService);

    // Initialiser mockTransaction
    mockTransaction = prismaService.getTransactionMock();

    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Réinitialiser le mock transaction avant chaque test
    prismaService.resetTransactionMock();
    mockTransaction = prismaService.getTransactionMock();

    // Phase 6.0.D.4 : ces tests ne testent pas la redirection tie-break
    // On force la fonction à retourner l'id fourni
    jest
      .spyOn(service as any, 'getActivePlayableMatchId')
      .mockImplementation(async (matchId: string) => matchId);
  });

  describe('joinMatch', () => {
    it('devrait initialiser RUNNING + fen + clocks quand les deux rejoignent', async () => {
      // Premier joueur (blanc) rejoint
      prismaService.match.findUnique.mockResolvedValueOnce({
        ...mockMatch,
        status: MatchStatus.PENDING,
      });

      prismaService.match.update.mockResolvedValueOnce({
        ...mockMatch,
        readyAt: new Date(),
        whiteJoinedAt: new Date(),
        status: MatchStatus.PENDING,
      });

      await service.joinMatch(mockMatchId, mockWhitePlayerId);

      // Deuxième joueur (noir) rejoint - doit initialiser la partie
      prismaService.match.findUnique.mockResolvedValueOnce({
        ...mockMatch,
        status: MatchStatus.PENDING,
        readyAt: new Date(),
        whiteJoinedAt: new Date(),
      });

      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
      const timeMs = 10 * 60 * 1000; // 10 minutes

      prismaService.match.update.mockResolvedValueOnce({
        ...mockMatch,
        readyAt: new Date(),
        whiteJoinedAt: new Date(),
        blackJoinedAt: new Date(),
        status: MatchStatus.RUNNING,
        startedAt: new Date(),
        initialFen: startFen,
        currentFen: startFen,
        lastMoveAt: new Date(),
        whiteTimeMsRemaining: timeMs,
        blackTimeMsRemaining: timeMs,
        moves: [],
      });

      const result = await service.joinMatch(mockMatchId, mockBlackPlayerId);

      expect(result.status).toBe(MatchStatus.RUNNING);
      expect(result.fen).toBe(startFen);
      expect(result.whiteTimeMsRemaining).toBe(timeMs);
      expect(result.blackTimeMsRemaining).toBe(timeMs);
      expect(prismaService.match.update).toHaveBeenCalledWith({
        where: { id: mockMatchId },
        data: expect.objectContaining({
          status: MatchStatus.RUNNING,
          initialFen: startFen,
          currentFen: startFen,
          whiteTimeMsRemaining: timeMs,
          blackTimeMsRemaining: timeMs,
        }),
        include: expect.any(Object),
      });
    });

    it("devrait rejeter un joueur qui n'est pas dans le match", async () => {
      prismaService.match.findUnique.mockResolvedValueOnce(mockMatch);

      await expect(service.joinMatch(mockMatchId, 'other-player-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('devrait rejeter un match FINISHED ou CANCELED', async () => {
      prismaService.match.findUnique.mockResolvedValueOnce({
        ...mockMatch,
        status: MatchStatus.FINISHED,
      });

      await expect(service.joinMatch(mockMatchId, mockWhitePlayerId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getMatchState', () => {
    it("devrait retourner l'état du match", async () => {
      const matchWithState = {
        ...mockMatch,
        status: MatchStatus.RUNNING,
        initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        whiteTimeMsRemaining: 600000,
        blackTimeMsRemaining: 600000,
        moves: [],
      };

      prismaService.match.findUnique.mockResolvedValueOnce(matchWithState);

      const result = await service.getMatchState(mockMatchId, mockWhitePlayerId);

      expect(result.matchId).toBe(mockMatchId);
      expect(result.status).toBe(MatchStatus.RUNNING);
      expect(result.whitePlayerId).toBe(mockWhitePlayerId);
      expect(result.blackPlayerId).toBe(mockBlackPlayerId);
      expect(result.fen).toBeDefined();
      expect(result.turn).toBeDefined();
      expect(result.serverTimeUtc).toBeDefined();
    });

    it("devrait rejeter un joueur qui n'est pas dans le match", async () => {
      prismaService.match.findUnique.mockResolvedValueOnce(mockMatch);

      await expect(service.getMatchState(mockMatchId, 'other-player-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('playMove', () => {
    const runningMatch = {
      ...mockMatch,
      status: MatchStatus.RUNNING,
      initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      startedAt: new Date(),
      lastMoveAt: new Date(),
      whiteTimeMsRemaining: 600000,
      blackTimeMsRemaining: 600000,
      moves: [],
    };

    it('devrait accepter e2-e4 depuis start position', async () => {
      const moveResult = chessEngineService.validateAndApplyMove(runningMatch.currentFen, {
        from: 'e2',
        to: 'e4',
      });

      expect(moveResult.success).toBe(true);

      // Mock pour la transaction (1er appel depuis maybeResolveNoShow, 2e depuis playMove)
      mockTransaction.match.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(runningMatch);
      mockTransaction.matchMove.create.mockResolvedValueOnce({
        id: 'move-123',
        matchId: mockMatchId,
        moveNumber: 1,
        playerId: mockWhitePlayerId,
        color: MatchColor.WHITE,
        san: 'e4',
        from: 'e2',
        to: 'e4',
        promotion: null,
        fenBefore: runningMatch.currentFen,
        fenAfter: moveResult.fenAfter,
        whiteTimeMsRemaining: 600000,
        blackTimeMsRemaining: 600000,
        createdAt: new Date(),
      });

      const updatedMatch = {
        ...runningMatch,
        currentFen: moveResult.fenAfter,
        lastMoveAt: new Date(),
        moves: [
          {
            san: 'e4',
            from: 'e2',
            to: 'e4',
            promotion: null,
          },
        ],
      };

      mockTransaction.match.update.mockResolvedValueOnce(updatedMatch);

      const result = await service.playMove(mockMatchId, mockWhitePlayerId, {
        from: 'e2',
        to: 'e4',
      });

      expect(result.moveNumber).toBe(1);
      expect(result.lastMove?.san).toBe('e4');
      expect(mockTransaction.matchMove.create).toHaveBeenCalled();
    });

    it('devrait rejeter un coup illégal', async () => {
      // Mock pour la transaction (1er appel depuis maybeResolveNoShow, 2e depuis playMove)
      mockTransaction.match.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(runningMatch);

      await expect(
        service.playMove(mockMatchId, mockWhitePlayerId, {
          from: 'e2',
          to: 'e5', // Coup illégal
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait rejeter NOT_YOUR_TURN', async () => {
      // Blanc essaie de jouer alors que c'est au noir (après un coup blanc)
      const matchAfterWhiteMove = {
        ...runningMatch,
        currentFen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1', // Après e4, c'est au noir
      };

      // Mock pour la transaction (1er appel depuis maybeResolveNoShow, 2e depuis playMove)
      mockTransaction.match.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(matchAfterWhiteMove);

      await expect(
        service.playMove(mockMatchId, mockWhitePlayerId, {
          from: 'd2',
          to: 'd4',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('devrait persister MatchMove (count=1)', async () => {
      const moveResult = chessEngineService.validateAndApplyMove(runningMatch.currentFen, {
        from: 'e2',
        to: 'e4',
      });

      // Mock pour la transaction (1er appel depuis maybeResolveNoShow, 2e depuis playMove)
      mockTransaction.match.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(runningMatch);
      mockTransaction.matchMove.create.mockResolvedValueOnce({
        id: 'move-123',
        matchId: mockMatchId,
        moveNumber: 1,
        playerId: mockWhitePlayerId,
        color: MatchColor.WHITE,
        san: 'e4',
        from: 'e2',
        to: 'e4',
        promotion: null,
        fenBefore: runningMatch.currentFen,
        fenAfter: moveResult.fenAfter,
        whiteTimeMsRemaining: 600000,
        blackTimeMsRemaining: 600000,
        createdAt: new Date(),
      });

      const updatedMatch = {
        ...runningMatch,
        currentFen: moveResult.fenAfter,
        lastMoveAt: new Date(),
        moves: [
          {
            san: 'e4',
            from: 'e2',
            to: 'e4',
            promotion: null,
          },
        ],
      };

      mockTransaction.match.update.mockResolvedValueOnce(updatedMatch);

      await service.playMove(mockMatchId, mockWhitePlayerId, {
        from: 'e2',
        to: 'e4',
      });

      expect(mockTransaction.matchMove.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          matchId: mockMatchId,
          moveNumber: 1,
          playerId: mockWhitePlayerId,
          color: MatchColor.WHITE,
          san: 'e4',
          from: 'e2',
          to: 'e4',
        }),
      });
    });

    it("devrait rejeter un match qui n'est pas RUNNING", async () => {
      // Mock pour la transaction (1er appel depuis maybeResolveNoShow, 2e depuis playMove)
      mockTransaction.match.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        ...mockMatch,
        status: MatchStatus.PENDING,
      });

      await expect(
        service.playMove(mockMatchId, mockWhitePlayerId, {
          from: 'e2',
          to: 'e4',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Phase 6.0.D.5 - Validations DRAW automatiques', () => {
    const drawMatch = {
      ...mockMatch,
      status: MatchStatus.RUNNING,
      initialFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      currentFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      startedAt: new Date(),
      lastMoveAt: new Date(),
      whiteTimeMsRemaining: 600000,
      blackTimeMsRemaining: 600000,
      moves: [],
    };

    let loggerErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock getActivePlayableMatchId et maybeResolveNoShow (méthodes privées)
      jest.spyOn(service as any, 'getActivePlayableMatchId').mockResolvedValue(mockMatchId);
      jest.spyOn(service as any, 'maybeResolveNoShow').mockResolvedValue(undefined);

      // Silencer logger.error pour ces tests (configurations invalides testées volontairement)
      loggerErrorSpy = jest.spyOn((service as any).logger, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      loggerErrorSpy.mockRestore();
    });

    it("devrait throw BadRequestException si requiresDecisiveResult=true et tieBreakPolicy=NONE lors d'un DRAW automatique", async () => {
      // Mock ChessEngineService pour retourner un DRAW automatique
      chessEngineService.validateAndApplyMove = jest.fn().mockReturnValue({
        success: true,
        fenBefore: drawMatch.currentFen,
        fenAfter: drawMatch.currentFen,
        san: 'e4',
        gameEnd: {
          reason: 'STALEMATE', // DRAW automatique
        },
      });

      // maybeResolveNoShow est mocké pour ne pas faire de transaction
      // Donc on a seulement l'appel dans playMove
      mockTransaction.match.findUnique.mockResolvedValueOnce(drawMatch);

      mockTransaction.tournament.findUnique.mockResolvedValue({
        tieBreakPolicy: TieBreakPolicy.NONE,
        requiresDecisiveResult: true,
        drawRuleMode: DrawRuleMode.ALLOW_ALL,
      });

      await expect(
        service.playMove(mockMatchId, mockWhitePlayerId, {
          from: 'e2',
          to: 'e4',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait throw BadRequestException si drawRuleMode=NO_DRAW et tieBreakPolicy=NONE lors d'un DRAW automatique", async () => {
      chessEngineService.validateAndApplyMove = jest.fn().mockReturnValue({
        success: true,
        fenBefore: drawMatch.currentFen,
        fenAfter: drawMatch.currentFen,
        san: 'e4',
        gameEnd: {
          reason: 'FIFTY_MOVE_RULE', // DRAW automatique
        },
      });

      mockTransaction.match.findUnique.mockResolvedValueOnce(drawMatch);

      mockTransaction.tournament.findUnique.mockResolvedValue({
        tieBreakPolicy: TieBreakPolicy.NONE,
        requiresDecisiveResult: false,
        drawRuleMode: DrawRuleMode.NO_DRAW,
      });

      await expect(
        service.playMove(mockMatchId, mockWhitePlayerId, {
          from: 'e2',
          to: 'e4',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("devrait marquer resultReason=TIEBREAK_PENDING si requiresDecisiveResult=true et tieBreakPolicy=RAPID lors d'un DRAW automatique", async () => {
      chessEngineService.validateAndApplyMove = jest.fn().mockReturnValue({
        success: true,
        fenBefore: drawMatch.currentFen,
        fenAfter: drawMatch.currentFen,
        san: 'e4',
        gameEnd: {
          reason: 'THREE_FOLD_REPETITION', // DRAW automatique
        },
      });

      mockTransaction.match.findUnique.mockResolvedValueOnce(drawMatch);

      mockTransaction.tournament.findUnique.mockResolvedValue({
        tieBreakPolicy: TieBreakPolicy.RAPID,
        requiresDecisiveResult: true,
        drawRuleMode: DrawRuleMode.ALLOW_ALL,
      });

      mockTransaction.matchMove.create.mockResolvedValue({
        id: 'move-123',
        matchId: mockMatchId,
        moveNumber: 1,
        playerId: mockWhitePlayerId,
        color: MatchColor.WHITE,
        san: 'e4',
        from: 'e2',
        to: 'e4',
        promotion: null,
        fenBefore: drawMatch.currentFen,
        fenAfter: drawMatch.currentFen,
        whiteTimeMsRemaining: 600000,
        blackTimeMsRemaining: 600000,
        createdAt: new Date(),
      });

      const updatedMatch = {
        ...drawMatch,
        status: MatchStatus.FINISHED,
        result: MatchResult.DRAW,
        resultReason: RESULT_REASON_TIEBREAK_PENDING,
        finishedAt: new Date(),
      };

      mockTransaction.match.update.mockResolvedValue(updatedMatch);

      // Mock createTieBreakMatches et generateNextRoundIfNeeded pour éviter les appels post-transaction
      jest.spyOn(service, 'createTieBreakMatches').mockResolvedValue(undefined);
      jest.spyOn(service as any, 'generateNextRoundIfNeeded').mockResolvedValue(undefined);

      await service.playMove(mockMatchId, mockWhitePlayerId, {
        from: 'e2',
        to: 'e4',
      });

      // Vérifier que resultReason est TIEBREAK_PENDING
      expect(mockTransaction.match.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            resultReason: RESULT_REASON_TIEBREAK_PENDING,
          }),
        }),
      );
    });
  });

  describe('resignMatch', () => {
    beforeEach(() => {
      // S'assurer que generateNextRoundIfNeeded ne casse pas les tests
      // (ces tests ne visent pas la génération de ronde)
      jest.spyOn(service as any, 'generateNextRoundIfNeeded').mockResolvedValue(undefined);
    });

    const runningMatch = {
      ...mockMatch,
      status: MatchStatus.RUNNING,
      whiteEntry: {
        ...mockMatch.whiteEntry,
        playerId: mockWhitePlayerId,
      },
      blackEntry: {
        ...mockMatch.blackEntry,
        playerId: mockBlackPlayerId,
      },
      tournament: {
        id: mockTournamentId,
        timeControl: '10+0',
      },
      moves: [],
    };

    it('devrait terminer le match par BLACK_WIN + RESIGNATION quand les blancs abandonnent', async () => {
      mockTransaction.match.findUnique.mockResolvedValueOnce(runningMatch);

      const finishedMatch = {
        ...runningMatch,
        status: MatchStatus.FINISHED,
        result: MatchResult.BLACK_WIN,
        resultReason: 'RESIGNATION',
        finishedAt: new Date(),
      };

      mockTransaction.match.update.mockResolvedValueOnce(finishedMatch);

      const result = await service.resignMatch(mockMatchId, mockWhitePlayerId);

      expect(result.status).toBe(MatchStatus.FINISHED);
      expect(result.result).toBe(MatchResult.BLACK_WIN);
      expect(result.resultReason).toBe('RESIGNATION');
    });

    it("devrait rejeter un joueur qui n'est pas dans le match", async () => {
      mockTransaction.match.findUnique.mockResolvedValueOnce(runningMatch);

      await expect(service.resignMatch(mockMatchId, 'other-player-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("devrait rejeter un match qui n'est pas RUNNING", async () => {
      mockTransaction.match.findUnique.mockResolvedValueOnce({
        ...runningMatch,
        status: MatchStatus.FINISHED,
      });

      await expect(service.resignMatch(mockMatchId, mockWhitePlayerId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('maybeResolveNoShow', () => {
    beforeEach(() => {
      // S'assurer que generateNextRoundIfNeeded ne casse pas les tests
      jest.spyOn(service as any, 'generateNextRoundIfNeeded').mockResolvedValue(undefined);
    });
    it('devrait résoudre DOUBLE_NO_SHOW quand aucun joueur ne rejoint après 90s', async () => {
      const pastReadyAt = new Date(Date.now() - 91 * 1000);

      const pendingMatch = {
        ...mockMatch,
        status: MatchStatus.PENDING,
        readyAt: pastReadyAt,
        whiteJoinedAt: null,
        blackJoinedAt: null,
        noShowResolvedAt: null,
      };

      mockTransaction.match.findUnique.mockResolvedValueOnce(pendingMatch);
      mockTransaction.match.update.mockResolvedValueOnce({
        ...pendingMatch,
        status: MatchStatus.FINISHED,
        result: MatchResult.DRAW,
        resultReason: 'DOUBLE_NO_SHOW',
        noShowResolvedAt: new Date(),
        finishedAt: new Date(),
      });

      const resolved = await (service as any).maybeResolveNoShow(mockMatchId);

      expect(resolved).toBe(true);
      expect(mockTransaction.match.update).toHaveBeenCalledWith({
        where: { id: mockMatchId },
        data: expect.objectContaining({
          status: MatchStatus.FINISHED,
          result: MatchResult.DRAW,
          resultReason: 'DOUBLE_NO_SHOW',
        }),
      });
    });

    it('devrait résoudre NO_SHOW en faveur du joueur présent', async () => {
      const pastReadyAt = new Date(Date.now() - 91 * 1000);

      const pendingMatch = {
        ...mockMatch,
        status: MatchStatus.PENDING,
        readyAt: pastReadyAt,
        whiteJoinedAt: new Date(),
        blackJoinedAt: null,
        noShowResolvedAt: null,
      };

      mockTransaction.match.findUnique.mockResolvedValueOnce(pendingMatch);
      mockTransaction.match.update.mockResolvedValueOnce({
        ...pendingMatch,
        status: MatchStatus.FINISHED,
        result: MatchResult.WHITE_WIN,
        resultReason: 'NO_SHOW',
        noShowResolvedAt: new Date(),
        finishedAt: new Date(),
      });

      const resolved = await (service as any).maybeResolveNoShow(mockMatchId);

      expect(resolved).toBe(true);
      expect(mockTransaction.match.update).toHaveBeenCalledWith({
        where: { id: mockMatchId },
        data: expect.objectContaining({
          status: MatchStatus.FINISHED,
          result: MatchResult.WHITE_WIN,
          resultReason: 'NO_SHOW',
        }),
      });
    });

    it('doit être idempotent si noShowResolvedAt est déjà renseigné', async () => {
      const pastReadyAt = new Date(Date.now() - 91 * 1000);

      const alreadyResolvedMatch = {
        ...mockMatch,
        status: MatchStatus.FINISHED,
        readyAt: pastReadyAt,
        whiteJoinedAt: null,
        blackJoinedAt: null,
        noShowResolvedAt: new Date(),
      };

      mockTransaction.match.findUnique.mockResolvedValueOnce(alreadyResolvedMatch);

      const resolved = await (service as any).maybeResolveNoShow(mockMatchId);

      expect(resolved).toBe(false);
      expect(mockTransaction.match.update).not.toHaveBeenCalled();
    });
  });
});
