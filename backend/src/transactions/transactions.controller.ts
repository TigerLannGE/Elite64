import { Controller } from '@nestjs/common';
import { TransactionsService } from './transactions.service';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  // Pour l'instant, on expose peu de routes publiques
  // Le focus est sur la logique de service qui sera utilisée par d'autres modules
  // Les routes seront ajoutées au fur et à mesure des besoins
}
