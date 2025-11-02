import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'User name is required'] },
  email: { type: String, required: [true, 'Email is required'], unique: true, index: true },
  pendingTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  dateCreated: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
