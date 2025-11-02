import express from 'express';
import User from '../models/user.js';
import Task from '../models/task.js';
import { applyQueryParams } from '../utils/query.js';
import { ok, created, badRequest, notFound, serverError } from '../utils/response.js';

const router = express.Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { query, count } = applyQueryParams(User, req.query);

    // 用户端默认不加 limit（与 MP 要求一致）
    if (count) {
      const n = await User.countDocuments(query.getQuery());
      return ok(res, n);
    }

    const docs = await query.exec();
    return ok(res, docs);
  } catch (err) {
    if (err.message.startsWith('Invalid')) return badRequest(res, err.message);
    return serverError(res, err);
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { name, email, pendingTasks } = req.body || {};
    if (!name && !email) return badRequest(res, 'User must have name or email');
    if (!name) return badRequest(res, 'User name is required');
    if (!email) return badRequest(res, 'User email is required');

    const exists = await User.findOne({ email });
    if (exists) return badRequest(res, 'Email already exists');

    const user = await User.create({ name, email, pendingTasks: Array.isArray(pendingTasks) ? pendingTasks : [] });

    // 如果传入了 pendingTasks，则同步任务的 assignedUser / assignedUserName
    if (Array.isArray(pendingTasks) && pendingTasks.length) {
      await Task.updateMany(
        { _id: { $in: pendingTasks } },
        { $set: { assignedUser: user._id, assignedUserName: user.name } }
      );
    }

    return created(res, user);
  } catch (err) {
    if (err?.code === 11000) return badRequest(res, 'Email already exists');
    return serverError(res, err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return notFound(res, 'User not found');
    return ok(res, user);
  } catch (err) {
    return serverError(res, err);
  }
});

// PUT /api/users/:id （替换整个用户）
router.put('/:id', async (req, res) => {
  try {
    const { name, email, pendingTasks } = req.body || {};
    if (!name && !email) return badRequest(res, 'User must have name or email');
    if (!name) return badRequest(res, 'User name is required');
    if (!email) return badRequest(res, 'User email is required');

    const user = await User.findById(req.params.id);
    if (!user) return notFound(res, 'User not found');

    if (email !== user.email) {
      const exists = await User.findOne({ email });
      if (exists) return badRequest(res, 'Email already exists');
    }

    // 先把老的 pendingTasks 全部置为未分配
    if (Array.isArray(user.pendingTasks) && user.pendingTasks.length) {
      await Task.updateMany(
        { _id: { $in: user.pendingTasks } },
        { $set: { assignedUser: null, assignedUserName: 'unassigned' } }
      );
    }

    // 应用新字段
    user.name = name;
    user.email = email;
    user.pendingTasks = Array.isArray(pendingTasks) ? pendingTasks : [];
    await user.save();

    // 再把新的 pendingTasks 关联回来
    if (user.pendingTasks.length) {
      await Task.updateMany(
        { _id: { $in: user.pendingTasks } },
        { $set: { assignedUser: user._id, assignedUserName: user.name } }
      );
    }

    return ok(res, user, 'Updated');
  } catch (err) {
    return serverError(res, err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return notFound(res, 'User not found');

    // 将该用户的 pendingTasks 全部置为未分配
    if (Array.isArray(user.pendingTasks) && user.pendingTasks.length) {
      await Task.updateMany(
        { _id: { $in: user.pendingTasks } },
        { $set: { assignedUser: null, assignedUserName: 'unassigned' } }
      );
    }

    await user.deleteOne();
    return ok(res, null, 'Deleted');
  } catch (err) {
    return serverError(res, err);
  }
});

export default router;
