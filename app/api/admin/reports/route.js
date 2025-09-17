import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Package from '../../../../lib/models/Package';
import Customer from '../../../../lib/models/Customer';
import Manifest from '../../../../lib/models/Manifest';

// GET /api/admin/reports - Generate various reports
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'summary';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branch = searchParams.get('branch');
    const format = searchParams.get('format') || 'json';
    
    console.log(`📊 Generating ${reportType} report`);
    
    // Build base query for date filtering
    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
    
    let baseQuery = {};
    if (Object.keys(dateQuery).length > 0) {
      baseQuery.entryDateTime = dateQuery;
    }
    if (branch) baseQuery.branch = branch;
    
    let reportData = {};
    
    switch (reportType) {
      case 'summary':
        reportData = await generateSummaryReport(baseQuery);
        break;
        
      case 'packages':
        reportData = await generatePackageReport(baseQuery, searchParams);
        break;
        
      case 'customers':
        reportData = await generateCustomerReport(baseQuery);
        break;
        
      case 'manifests':
        reportData = await generateManifestReport(baseQuery);
        break;
        
      case 'financial':
        reportData = await generateFinancialReport(baseQuery);
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid report type' },
          { status: 400 }
        );
    }
    
    const response = {
      success: true,
      reportType,
      generatedAt: new Date().toISOString(),
      filters: { startDate, endDate, branch },
      data: reportData
    };
    
    console.log(`✅ ${reportType} report generated successfully`);
    
    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('❌ Report generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate report',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Generate summary report
async function generateSummaryReport(baseQuery) {
  const [packageStats, customerStats, manifestStats] = await Promise.all([
    Package.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalPackages: { $sum: 1 },
          totalWeight: { $sum: '$weight' },
          avgWeight: { $avg: '$weight' },
          statusBreakdown: {
            $push: {
              status: '$packageStatus',
              weight: '$weight'
            }
          }
        }
      }
    ]),
    
    Customer.countDocuments({ isActive: true }),
    
    Manifest.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalManifests: { $sum: 1 },
          totalItems: { $sum: '$itemCount' },
          totalWeight: { $sum: '$weight' }
        }
      }
    ])
  ]);
  
  return {
    packages: packageStats[0] || { totalPackages: 0, totalWeight: 0, avgWeight: 0 },
    customers: { total: customerStats },
    manifests: manifestStats[0] || { totalManifests: 0, totalItems: 0, totalWeight: 0 }
  };
}

// Generate package report
async function generatePackageReport(baseQuery, searchParams) {
  const limit = parseInt(searchParams.get('limit')) || 1000;
  const skip = parseInt(searchParams.get('skip')) || 0;
  
  const packages = await Package.find(baseQuery)
    .populate('customerRef', 'userCode firstName lastName email')
    .sort({ entryDateTime: -1 })
    .limit(limit)
    .skip(skip)
    .lean();
  
  return {
    packages: packages.map(pkg => ({
      trackingNumber: pkg.trackingNumber,
      controlNumber: pkg.controlNumber,
      customerName: `${pkg.firstName} ${pkg.lastName}`,
      userCode: pkg.userCode,
      weight: pkg.weight,
      shipper: pkg.shipper,
      branch: pkg.branch,
      status: pkg.packageStatus,
      statusName: getStatusName(pkg.packageStatus),
      entryDate: pkg.entryDateTime,
      claimed: pkg.claimed,
      discrepancy: pkg.discrepancy
    })),
    total: packages.length
  };
}

// Generate customer report
async function generateCustomerReport(baseQuery) {
  const customers = await Customer.aggregate([
    {
      $lookup: {
        from: 'packages',
        localField: '_id',
        foreignField: 'customerRef',
        as: 'packages'
      }
    },
    {
      $project: {
        userCode: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        branch: 1,
        isActive: 1,
        totalPackages: { $size: '$packages' },
        totalWeight: { $sum: '$packages.weight' },
        pendingPackages: {
          $size: {
            $filter: {
              input: '$packages',
              cond: { $lt: ['$$this.packageStatus', 4] }
            }
          }
        }
      }
    }
  ]);
  
  return { customers };
}

// Generate manifest report
async function generateManifestReport(baseQuery) {
  const manifests = await Manifest.find(baseQuery)
    .populate('packages', 'trackingNumber weight packageStatus')
    .sort({ entryDateTime: -1 })
    .lean();
  
  return {
    manifests: manifests.map(manifest => ({
      manifestCode: manifest.manifestCode,
      awbNumber: manifest.awbNumber,
      flightDate: manifest.flightDate,
      weight: manifest.weight,
      itemCount: manifest.itemCount,
      packageCount: manifest.packages?.length || 0,
      status: manifest.manifestStatus,
      entryDate: manifest.entryDateTime
    }))
  };
}

// Generate financial report
async function generateFinancialReport(baseQuery) {
  // This would include payment and billing information
  // For now, return basic package-based financial data
  const financialData = await Package.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: '$branch',
        packageCount: { $sum: 1 },
        totalWeight: { $sum: '$weight' },
        deliveredPackages: {
          $sum: { $cond: [{ $eq: ['$packageStatus', 4] }, 1, 0] }
        }
      }
    }
  ]);
  
  return { financialBreakdown: financialData };
}

function getStatusName(status) {
  const statusNames = {
    0: 'AT WAREHOUSE',
    1: 'DELIVERED TO AIRPORT',
    2: 'IN TRANSIT TO LOCAL PORT', 
    3: 'AT LOCAL PORT',
    4: 'AT LOCAL SORTING'
  };
  return statusNames[status] || 'UNKNOWN';
}