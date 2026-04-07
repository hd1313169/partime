import { Router } from 'express';
import { createSalaryService } from '../services/salary-service';
import { assertValidWeeklyPricePayload } from '../http/validate';

export function createWeeklyPricesRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.put('/weekly-prices/:weekStart', (req, res) => {
    assertValidWeeklyPricePayload(req.body);
    service.setWeeklyPrice(req.params.weekStart, req.body.jobId, req.body.unitPrice);
    res.status(204).send();
  });

  return router;
}
