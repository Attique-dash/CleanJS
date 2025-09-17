import Manifest from '../models/Manifest';
import Package from '../models/Package';
import { DEFAULTS } from '../config/constants';

export async function listManifests({ page = 1, pageSize = DEFAULTS.PAGE_SIZE, query = {} } = {}) {
  const skip = (page - 1) * pageSize;
  const [items, total] = await Promise.all([
    Manifest.find(query).sort({ entryDateTime: -1 }).skip(skip).limit(pageSize).lean(),
    Manifest.countDocuments(query),
  ]);
  return { items, total, page, pageSize };
}

export async function createManifest(data) {
  const manifest = new Manifest(data);
  await manifest.save();
  return manifest.toObject();
}

export async function addPackageToManifest(manifestID, trackingNumber) {
  const [manifest, pkg] = await Promise.all([
    Manifest.findOne({ manifestID }),
    Package.findOne({ trackingNumber }),
  ]);
  if (!manifest || !pkg) return null;
  manifest.packages = manifest.packages || [];
  if (!manifest.packages.find((p) => p.equals?.(pkg._id) || p.toString() === String(pkg._id))) {
    manifest.packages.push(pkg._id);
  }
  await manifest.save();
  return manifest.toObject();
}

export async function updateManifestStatus(manifestID, newStatus, meta = {}) {
  const manifest = await Manifest.findOne({ manifestID });
  if (!manifest) return null;
  manifest.updateStatus(String(newStatus), meta.location, meta.notes, meta.updatedBy);
  await manifest.save();
  return manifest.toObject();
}


