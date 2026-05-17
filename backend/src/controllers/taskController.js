import Task from '../models/Task.js';

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

    // 3. Update task fields dynamically
    const fieldsToUpdate = [
      'title',
      'description',
      'priority',
      'category',
      'completed',
      'dueDate',
      'reminderTime',
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    const updatedTask = await task.save();
    res.status(200).json(updatedTask);
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

    res.status(200).json({ message: 'Task removed successfully ✅' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
