import Package from '../models/Package';
import { DEFAULTS } from '../config/constants';

export async function listPackages({ page = 1, pageSize = DEFAULTS.PAGE_SIZE, query = {} } = {}) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    Package.find(query).sort({ entryDateTime: -1 }).skip(skip).limit(pageSize).lean(),
    Package.countDocuments(query),
  ]);
  return { items, total, page, pageSize };
}

export async function getPackageByTracking(trackingNumber) {
  return Package.findOne({ trackingNumber }).lean();
}

export async function createPackage(data) {
  const pkg = new Package(data);
  await pkg.save();
  return pkg.toObject();
}

export async function updatePackage(trackingNumber, updates) {
  const pkg = await Package.findOneAndUpdate({ trackingNumber }, { $set: updates }, { new: true });
  return pkg?.toObject() || null;
}

export async function deletePackage(trackingNumber) {
  const res = await Package.deleteOne({ trackingNumber });
  return res.deletedCount === 1;
}


