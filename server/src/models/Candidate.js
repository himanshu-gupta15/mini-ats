import mongoose from 'mongoose';

export const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
export const SOURCES = ['LinkedIn', 'Referral', 'Job Board', 'Company Site', 'Agency', 'Other'];

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    author: { type: String, default: 'Recruiter', trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const stageEventSchema = new mongoose.Schema(
  {
    from: { type: String, enum: [...STAGES, null], default: null },
    to: { type: String, enum: STAGES, required: true },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email is invalid'],
    },
    phone: { type: String, trim: true, default: '' },
    position: { type: String, required: [true, 'Position is required'], trim: true },
    location: { type: String, trim: true, default: '' },
    experience: { type: Number, min: 0, max: 60, default: 0 },
    skills: { type: [String], default: [] },
    source: { type: String, enum: SOURCES, default: 'Other' },
    stage: { type: String, enum: STAGES, default: 'Applied', index: true },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    resumeUrl: { type: String, trim: true, default: '' },
    appliedAt: { type: Date, default: Date.now, index: true },
    notes: { type: [noteSchema], default: [] },
    stageHistory: { type: [stageEventSchema], default: [] },
  },
  { timestamps: true }
);

candidateSchema.index({ name: 'text', email: 'text', position: 'text', skills: 'text' });

candidateSchema.pre('save', function (next) {
  if (this.isNew && this.stageHistory.length === 0) {
    this.stageHistory.push({ from: null, to: this.stage, changedAt: this.appliedAt || new Date() });
  }
  this.skills = [...new Set((this.skills || []).map((s) => s.trim()).filter(Boolean))];
  next();
});

export default mongoose.model('Candidate', candidateSchema);
