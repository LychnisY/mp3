import express from 'express';
import Task from '../models/task.js';
import User from '../models/user.js';
import { applyQueryParams } from '../utils/query.js';
import { ok, created, badRequest, notFound, serverError } from '../utils/response.js';

const router = express.Router();

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { query, count } = applyQueryParams(Task, req.query);

    if (req.query.limit === undefined) {
      query.limit(100); // MP: default limit for tasks
    }

    if (count) {
      const n = await Task.countDocuments(query.getQuery());
      return ok(res, n);
    }
    const docs = await query.exec();
    return ok(res, docs);
  } catch (err) {
    if (err.message.startsWith('Invalid')) return badRequest(res, err.message);
    return serverError(res, err);
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body || {};
    if (!name) return badRequest(res, 'Task name is required');
    if (!deadline) return badRequest(res, 'Deadline is required');

    const task = await Task.create({
      name,
      description: description || '',
      deadline,
      completed: Boolean(completed),
      assignedUser: assignedUser || null,
      assignedUserName: assignedUser ? (assignedUserName || '') : 'unassigned'
    });

    if (task.assignedUser) {
      const user = await User.findById(task.assignedUser);
      if (user) {
        user.pendingTasks.addToSet(task._id);
        if (!task.assignedUserName) task.assignedUserName = user.name;
        await user.save();
        await task.save();
      }
    }

    return created(res, task);
  } catch (err) { return serverError(res, err); }
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return notFound(res, 'Task not found');
    return ok(res, task);
  } catch (err) { return serverError(res, err); }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body || {};
    if (!name) return badRequest(res, 'Task name is required');
    if (!deadline) return badRequest(res, 'Deadline is required');

    const task = await Task.findById(req.params.id);
    if (!task) return notFound(res, 'Task not found');

    if (task.assignedUser) {
      await User.updateOne({ _id: task.assignedUser }, { $pull: { pendingTasks: task._id } });
    }

    task.name = name;
    task.description = description || '';
    task.deadline = deadline;
    task.completed = Boolean(completed);
    task.assignedUser = assignedUser || null;
    task.assignedUserName = assignedUser ? (assignedUserName || task.assignedUserName || '') : 'unassigned';
    await task.save();

    if (task.assignedUser) {
      const newUser = await User.findById(task.assignedUser);
      if (newUser) {
        newUser.pendingTasks.addToSet(task._id);
        if (!assignedUserName) {
          task.assignedUserName = newUser.name;
          await task.save();
        }
        await newUser.save();
      }
    }

    return ok(res, task, 'Updated');
  } catch (err) { return serverError(res, err); }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return notFound(res, 'Task not found');

    if (task.assignedUser) {
      await User.updateOne({ _id: task.assignedUser }, { $pull: { pendingTasks: task._id } });
    }

    await task.deleteOne();
    return ok(res, null, 'Deleted');
  } catch (err) { return serverError(res, err); }
});

export default router;
