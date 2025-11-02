import express from 'express';
import { ok } from '../utils/response.js';

const router = express.Router();
router.get('/', (req, res) => ok(res, { service: 'mp-task-api' }, 'API is up'));

export default router;
