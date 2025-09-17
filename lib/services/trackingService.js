import Package from '../models/Package';
import { STATUS_NAMES } from '../config/constants';

export async function getTracking(trackingNumber) {
  const pkg = await Package.findOne({ trackingNumber }).lean();
  if (!pkg) return null;
  const statusName = STATUS_NAMES[pkg.packageStatus] || `Status ${pkg.packageStatus}`;
  return {
    trackingNumber: pkg.trackingNumber,
    status: pkg.packageStatus,
    statusName,
    branch: pkg.branch,
    lastUpdated: pkg.entryDateTime,
    statusHistory: pkg.statusHistory || [],
  };
}

export async function addTrackingEvent(trackingNumber, { status, location = '', notes = '', updatedBy = 'System' }) {
  const pkg = await Package.findOne({ trackingNumber });
  if (!pkg) return null;
  pkg.updateStatus(status, location, notes, updatedBy);
  await pkg.save();
  return pkg;
}


