import { NextFunction, Request, Response, Router } from 'express';
import { createSalaryService } from '../services/salary-service';
import { assertValidWeeklyPricePayload } from '../http/validate';

function runAsync(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res).catch(next);
  };
}

export function createWeeklyPricesRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.put(
    '/weekly-prices/:weekStart',
    runAsync(async (req, res) => {
      assertValidWeeklyPricePayload(req.body);
      await service.setWeeklyPrice(req.params.weekStart, req.body.jobId, req.body.unitPrice);
      res.status(204).send();
    }),
  );

  return router;
}
