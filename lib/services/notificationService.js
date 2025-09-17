import Package from '../models/Package';
import sendMail from '../utils/sendMail';

export async function queuePackageNotification(trackingNumber, type, message) {
  const pkg = await Package.findOne({ trackingNumber });
  if (!pkg) return null;
  pkg.addNotification(type, message);
  await pkg.save();
  return pkg.toObject();
}

export async function sendWelcomeEmail(email, username) {
  return sendMail(email, username);
}


