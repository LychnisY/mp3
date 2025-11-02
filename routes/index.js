import express from 'express';
import home from './home.js';
import users from './users.js';
import tasks from './tasks.js';

const router = express.Router();

router.use('/', home);
router.use('/users', users);
router.use('/tasks', tasks);

export default router;
