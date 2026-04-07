import { Router } from 'express';
import { createSalaryService } from '../services/salary-service';

export function createBootstrapRouter(service: ReturnType<typeof createSalaryService>) {
  const router = Router();

  router.get('/bootstrap', (_req, res) => {
    res.json({ data: service.getBootstrapData() });
  });

  return router;
}
