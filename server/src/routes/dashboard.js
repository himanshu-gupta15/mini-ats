import { Router } from 'express';
import Candidate, { STAGES } from '../models/Candidate.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const DAY = 24 * 60 * 60 * 1000;

router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    const weeks = Math.min(26, Math.max(4, parseInt(req.query.weeks, 10) || 8));
    const now = new Date();
    const since = new Date(now.getTime() - weeks * 7 * DAY);
    const last30 = new Date(now.getTime() - 30 * DAY);

    const [facet] = await Candidate.aggregate([
      {
        $facet: {
          total: [{ $count: 'n' }],
          byStage: [{ $group: { _id: '$stage', count: { $sum: 1 } } }],
          bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          byPosition: [
            {
              $group: {
                _id: '$position',
                count: { $sum: 1 },
                hired: { $sum: { $cond: [{ $eq: ['$stage', 'Hired'] }, 1, 0] } },
                active: { $sum: { $cond: [{ $in: ['$stage', ['Hired', 'Rejected']] }, 0, 1] } },
              },
            },
            { $sort: { count: -1 } },
            { $limit: 6 },
          ],
          recent30: [{ $match: { appliedAt: { $gte: last30 } } }, { $count: 'n' }],
          weekly: [
            { $match: { appliedAt: { $gte: since } } },
            { $group: { _id: { $floor: { $divide: [{ $subtract: [now, '$appliedAt'] }, 7 * DAY] } }, count: { $sum: 1 } } },
          ],
          timeToHire: [
            { $match: { stage: 'Hired' } },
            { $unwind: '$stageHistory' },
            { $match: { 'stageHistory.to': 'Hired' } },
            { $group: { _id: '$_id', hiredAt: { $max: '$stageHistory.changedAt' }, appliedAt: { $first: '$appliedAt' } } },
            { $group: { _id: null, avgMs: { $avg: { $subtract: ['$hiredAt', '$appliedAt'] } } } },
          ],
          // Candidates that ever reached each stage (via history) - used for funnel conversion
          reached: [
            { $project: { stages: { $setUnion: ['$stageHistory.to', ['$stage']] } } },
            { $unwind: '$stages' },
            { $group: { _id: '$stages', count: { $sum: 1 } } },
          ],
          avgRating: [{ $match: { rating: { $gt: 0 } } }, { $group: { _id: null, v: { $avg: '$rating' } } }],
        },
      },
    ]);

    const total = facet.total[0]?.n || 0;
    const stageMap = Object.fromEntries(facet.byStage.map((s) => [s._id, s.count]));
    const reachedMap = Object.fromEntries(facet.reached.map((s) => [s._id, s.count]));
    const byStage = STAGES.map((stage) => ({ stage, count: stageMap[stage] || 0 }));

    // A candidate who reached a later stage also passed the earlier ones.
    const pipeline = STAGES.filter((s) => s !== 'Rejected');
    const funnel = pipeline.map((stage, i) => {
      const count = pipeline.slice(i).reduce((max, s) => Math.max(max, reachedMap[s] || 0), 0);
      return { stage, count };
    });
    funnel[0].count = total;

    const weeklyMap = Object.fromEntries(facet.weekly.map((w) => [w._id, w.count]));
    const weekly = Array.from({ length: weeks }, (_, i) => {
      const idx = weeks - 1 - i;
      const start = new Date(now.getTime() - (idx + 1) * 7 * DAY);
      return { weekStart: start.toISOString().slice(0, 10), count: weeklyMap[idx] || 0 };
    });

    const hired = stageMap.Hired || 0;
    const rejected = stageMap.Rejected || 0;
    const offers = reachedMap.Offer || 0;

    res.json({
      totals: {
        total,
        active: total - hired - rejected,
        hired,
        rejected,
        newLast30Days: facet.recent30[0]?.n || 0,
        hireRate: total ? +((hired / total) * 100).toFixed(1) : 0,
        offerAcceptance: offers ? +((hired / offers) * 100).toFixed(1) : 0,
        avgTimeToHireDays: facet.timeToHire[0] ? +(facet.timeToHire[0].avgMs / DAY).toFixed(1) : null,
        avgRating: facet.avgRating[0] ? +facet.avgRating[0].v.toFixed(2) : null,
      },
      byStage,
      funnel,
      bySource: facet.bySource.map((s) => ({ source: s._id, count: s.count })),
      topPositions: facet.byPosition.map((p) => ({ position: p._id, count: p.count, hired: p.hired, active: p.active })),
      weekly,
    });
  })
);

export default router;
