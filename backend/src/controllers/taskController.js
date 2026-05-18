import Task from '../models/Task.js';
import { updateStreakAndScore, checkAndUnlockAchievements, recalculateUserStats } from '../services/gamificationEngine.js';

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res) => {
  try {
    const { title, description, priority, category, dueDate, reminderTime } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      category,
      dueDate,
      reminderTime,
      user: req.user._id,
    });

    const offset = parseInt(req.headers['x-timezone-offset'] || '0', 10);
    await recalculateUserStats(req.user._id, offset);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all tasks of the logged-in user
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update an existing task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // 1. Check if task exists
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // 2. Verify ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized to update this task' });
    }

    // Capture completion state change
    const wasCompleted = task.completed;

    // 3. Update task fields dynamically
    const fieldsToUpdate = [
      'title',
      'description',
      'priority',
      'category',
      'dueDate',
      'reminderTime',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // Handle completed toggle safely with completedAt timestamps
    if (req.body.completed !== undefined) {
      if (!wasCompleted && req.body.completed) {
        task.completed = true;
        task.completedAt = new Date();
      } else if (wasCompleted && !req.body.completed) {
        task.completed = false;
        task.completedAt = null;
      }
    }

    const updatedTask = await task.save();

    // Trigger centralized gamification updates timezone-safely
    const offset = parseInt(req.headers['x-timezone-offset'] || '0', 10);
    const { newlyUnlocked } = await recalculateUserStats(req.user._id, offset);

    // Return task object enriched with newly unlocked achievements
    const taskObj = updatedTask.toObject();
    taskObj.newlyUnlocked = newlyUnlocked || [];

    res.status(200).json(taskObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    // 1. Check if task exists
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // 2. Verify ownership
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ error: 'Not authorized to delete this task' });
    }

    // 3. Delete task
    await task.deleteOne();

    const offset = parseInt(req.headers['x-timezone-offset'] || '0', 10);
    await recalculateUserStats(req.user._id, offset);

    res.status(200).json({ message: 'Task removed successfully ✅' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
