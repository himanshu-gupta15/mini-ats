import { Router } from 'express';
import Candidate, { STAGES, SOURCES } from '../models/Candidate.js';
import { asyncHandler, HttpError } from '../middleware/errorHandler.js';
import { escapeRegex } from '../utils/escapeRegex.js';

const router = Router();

const EDITABLE = ['name', 'email', 'phone', 'position', 'location', 'experience', 'skills', 'source', 'rating', 'resumeUrl', 'appliedAt'];
const SORTS = {
  newest: { appliedAt: -1 },
  oldest: { appliedAt: 1 },
  name: { name: 1 },
  rating: { rating: -1, appliedAt: -1 },
  experience: { experience: -1 },
};

function pick(body, keys) {
  const out = {};
  for (const k of keys) if (body[k] !== undefined) out[k] = body[k];
  if (typeof out.skills === 'string') out.skills = out.skills.split(',');
  return out;
}

router.get('/meta', (req, res) => res.json({ stages: STAGES, sources: SOURCES }));

// GET /api/candidates?search=&stage=&position=&source=&skill=&minExp=&sort=&page=&limit=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { search, stage, position, source, skill, minExp, sort = 'newest' } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));

    const filter = {};
    if (search?.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { position: rx }, { skills: rx }, { location: rx }];
    }
    if (stage) filter.stage = { $in: String(stage).split(',') };
    if (source) filter.source = { $in: String(source).split(',') };
    if (position) filter.position = new RegExp(escapeRegex(position), 'i');
    if (skill) filter.skills = { $all: String(skill).split(',').map((s) => new RegExp(`^${escapeRegex(s.trim())}$`, 'i')) };
    if (minExp) filter.experience = { $gte: Number(minExp) };

    const [items, total] = await Promise.all([
      Candidate.find(filter)
        .select('-notes -stageHistory')
        .sort(SORTS[sort] || SORTS.newest)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Candidate.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) || 1, limit });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const c = await Candidate.findById(req.params.id);
    if (!c) throw new HttpError(404, 'Candidate not found');
    res.json(c);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = pick(req.body, [...EDITABLE, 'stage']);
    const c = await Candidate.create(data);
    res.status(201).json(c);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const c = await Candidate.findById(req.params.id);
    if (!c) throw new HttpError(404, 'Candidate not found');
    c.set(pick(req.body, EDITABLE));
    await c.save();
    res.json(c);
  })
);

router.patch(
  '/:id/stage',
  asyncHandler(async (req, res) => {
    const { stage } = req.body;
    if (!STAGES.includes(stage)) throw new HttpError(400, `Stage must be one of: ${STAGES.join(', ')}`);
    const c = await Candidate.findById(req.params.id);
    if (!c) throw new HttpError(404, 'Candidate not found');
    if (c.stage !== stage) {
      c.stageHistory.push({ from: c.stage, to: stage, changedAt: new Date() });
      c.stage = stage;
      await c.save();
    }
    res.json(c);
  })
);

router.post(
  '/:id/notes',
  asyncHandler(async (req, res) => {
    const text = req.body.text?.trim();
    if (!text) throw new HttpError(400, 'Note text is required');
    const c = await Candidate.findById(req.params.id);
    if (!c) throw new HttpError(404, 'Candidate not found');
    c.notes.unshift({ text, author: req.body.author || 'Recruiter' });
    await c.save();
    res.status(201).json(c);
  })
);

router.delete(
  '/:id/notes/:noteId',
  asyncHandler(async (req, res) => {
    const c = await Candidate.findById(req.params.id);
    if (!c) throw new HttpError(404, 'Candidate not found');
    c.notes.pull({ _id: req.params.noteId });
    await c.save();
    res.json(c);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const c = await Candidate.findByIdAndDelete(req.params.id);
    if (!c) throw new HttpError(404, 'Candidate not found');
    res.status(204).end();
  })
);

export default router;
