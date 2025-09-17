import Package from '../models/Package';

export async function getDailySummary(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const pipeline = [
    { $match: { entryDate: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        totalWeight: { $sum: '$weight' },
        byStatus: { $push: '$packageStatus' },
      },
    },
  ];

  const [agg] = await Package.aggregate(pipeline);
  const byStatusCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
  (agg?.byStatus || []).forEach((s) => {
    byStatusCounts[s] = (byStatusCounts[s] || 0) + 1;
  });

  return {
    total: agg?.total || 0,
    totalWeight: agg?.totalWeight || 0,
    byStatus: byStatusCounts,
  };
}


