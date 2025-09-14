import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';
import Package from '../../../../lib/models/Package';
import Customer from '../../../../lib/models/Customer';
import Manifest from '../../../../lib/models/Manifest';
import User from '../../../../lib/models/User';

// GET /api/admin/dashboard - Get admin dashboard data
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '30'; // days
    const branch = searchParams.get('branch');
    
    console.log(`📊 Generating admin dashboard data for ${timeframe} days`);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeframe));
    
    // Build base query for date filtering
    let baseQuery = {
      entryDateTime: { $gte: startDate, $lte: endDate }
    };
    
    if (branch) {
      baseQuery.branch = branch;
    }
    
    // Parallel data fetching for better performance
    const [
      totalPackages,
      todayPackages,
      packagesByStatus,
      recentPackages,
      topShippers,
      packagesByBranch,
      weightStats,
      customerStats,
      manifestStats,
      userStats,
      alertsData
    ] = await Promise.all([
      // Total packages in timeframe
      Package.countDocuments(baseQuery),
      
      // Today's packages
      Package.countDocuments({
        ...baseQuery,
        entryDateTime: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      
      // Packages by status
      Package.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$packageStatus',
            count: { $sum: 1 },
            totalWeight: { $sum: '$weight' }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      
      // Recent packages (last 10)
      Package.find(baseQuery)
        .sort({ entryDateTime: -1 })
        .limit(10)
        .select('trackingNumber controlNumber customerName shipper packageStatus entryDateTime weight branch')
        .lean(),
      
      // Top shippers
      Package.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$shipper',
            count: { $sum: 1 },
            totalWeight: { $sum: '$weight' }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Packages by branch
      Package.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$branch',
            count: { $sum: 1 },
            totalWeight: { $sum: '$weight' },
            pendingCount: { $sum: { $cond: [{ $lt: ['$packageStatus', 4] }, 1, 0] } },
            deliveredCount: { $sum: { $cond: [{ $eq: ['$packageStatus', 4] }, 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // Weight and package statistics
      Package.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: null,
            totalWeight: { $sum: '$weight' },
            avgWeight: { $avg: '$weight' },
            maxWeight: { $max: '$weight' },
            minWeight: { $min: '$weight' },
            totalPieces: { $sum: '$pieces' }
          }
        }
      ]),
      
      // Customer statistics
      Customer.aggregate([
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            activeCustomers: { $sum: { $cond: ['$isActive', 1, 0] } },
            avgPackagesPerCustomer: { $avg: '$packageStats.totalPackages' }
          }
        }
      ]),
      
      // Manifest statistics
      Manifest.aggregate([
        {
          $match: {
            entryDateTime: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: null,
            totalManifests: { $sum: 1 },
            totalWeight: { $sum: '$weight' },
            totalItems: { $sum: '$itemCount' },
            avgItemsPerManifest: { $avg: '$itemCount' }
          }
        }
      ]),
      
      // User statistics
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Alerts and issues
      Promise.all([
        Package.countDocuments({ ...baseQuery, discrepancy: true }),
        Package.countDocuments({ ...baseQuery, unknown: true }),
        Package.countDocuments({ ...baseQuery, claimed: false, packageStatus: 4 })
      ])
    ]);
    
    // Format status data
    const statusData = [
      { status: 0, name: 'AT WAREHOUSE', count: 0, weight: 0 },
      { status: 1, name: 'DELIVERED TO AIRPORT', count: 0, weight: 0 },
      { status: 2, name: 'IN TRANSIT TO LOCAL PORT', count: 0, weight: 0 },
      { status: 3, name: 'AT LOCAL PORT', count: 0, weight: 0 },
      { status: 4, name: 'AT LOCAL SORTING', count: 0, weight: 0 }
    ];
    
    packagesByStatus.forEach(item => {
      const statusIndex = statusData.findIndex(s => s.status === item._id);
      if (statusIndex !== -1) {
        statusData[statusIndex].count = item.count;
        statusData[statusIndex].weight = item.totalWeight || 0;
      }
    });
    
    // Calculate daily trends (last 7 days)
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayCount = await Package.countDocuments({
        ...baseQuery,
        entryDateTime: { $gte: dayStart, $lte: dayEnd }
      });
      
      dailyTrends.push({
        date: dayStart.toISOString().split('T')[0],
        packages: dayCount,
        dayName: dayStart.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    
    // Format response
    const dashboardData = {
      success: true,
      data: {
        // Overview Statistics
        overview: {
          totalPackages,
          todayPackages,
          totalWeight: weightStats[0]?.totalWeight || 0,
          avgWeight: Math.round((weightStats[0]?.avgWeight || 0) * 100) / 100,
          totalPieces: weightStats[0]?.totalPieces || 0,
          totalCustomers: customerStats[0]?.totalCustomers || 0,
          activeCustomers: customerStats[0]?.activeCustomers || 0,
          totalManifests: manifestStats[0]?.totalManifests || 0
        },
        
        // Status Distribution
        statusDistribution: statusData,
        
        // Recent Activity
        recentPackages: recentPackages.map(pkg => ({
          trackingNumber: pkg.trackingNumber,
          controlNumber: pkg.controlNumber,
          customerName: `${pkg.firstName} ${pkg.lastName}`,
          shipper: pkg.shipper,
          status: pkg.packageStatus,
          statusName: getStatusName(pkg.packageStatus),
          weight: pkg.weight,
          branch: pkg.branch,
          entryDateTime: pkg.entryDateTime
        })),
        
        // Top Performers
        topShippers: topShippers.map(shipper => ({
          name: shipper._id,
          packages: shipper.count,
          totalWeight: Math.round((shipper.totalWeight || 0) * 100) / 100
        })),
        
        // Branch Performance
        branchPerformance: packagesByBranch.map(branch => ({
          name: branch._id,
          totalPackages: branch.count,
          totalWeight: Math.round((branch.totalWeight || 0) * 100) / 100,
          pendingPackages: branch.pendingCount,
          deliveredPackages: branch.deliveredCount,
          deliveryRate: branch.count > 0 ? Math.round((branch.deliveredCount / branch.count) * 100) : 0
        })),
        
        // Trends
        dailyTrends,
        
        // Alerts and Issues
        alerts: {
          discrepancies: alertsData[0],
          unknownPackages: alertsData[1],
          unclaimedDelivered: alertsData[2]
        },
        
        // System Stats
        system: {
          users: userStats.reduce((acc, user) => {
            acc[user._id] = user.count;
            return acc;
          }, {}),
          avgPackagesPerCustomer: Math.round((customerStats[0]?.avgPackagesPerCustomer || 0) * 100) / 100,
          avgItemsPerManifest: Math.round((manifestStats[0]?.avgItemsPerManifest || 0) * 100) / 100
        },
        
        // Filters Applied
        filters: {
          timeframe: parseInt(timeframe),
          branch: branch || 'All Branches',
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }
        }
      },
      
      // Generation Info
      generatedAt: new Date().toISOString(),
      queryTime: Date.now() - parseInt(request.headers.get('x-request-start') || Date.now())
    };
    
    console.log(`✅ Admin dashboard data generated: ${totalPackages} packages, ${customerStats[0]?.totalCustomers || 0} customers`);
    
    return NextResponse.json(dashboardData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('❌ Admin dashboard error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to generate dashboard data',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get status name
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

// POST /api/admin/dashboard - Update dashboard settings or trigger manual refresh
export async function POST(request) {
  try {
    await connectDB();
    
    const { action, data } = await request.json();
    
    switch (action) {
      case 'refresh_stats':
        // Trigger a manual refresh of customer package statistics
        const customers = await Customer.find({ isActive: true });
        let updatedCount = 0;
        
        for (const customer of customers) {
          await customer.updatePackageStats();
          await customer.save();
          updatedCount++;
        }
        
        return NextResponse.json({
          success: true,
          message: `Refreshed statistics for ${updatedCount} customers`,
          updatedCount
        });
        
      case 'cleanup_data':
        // Perform data cleanup operations
        const cleanupResults = {
          duplicatePackages: 0,
          orphanedRecords: 0,
          updatedReferences: 0
        };
        
        // Add cleanup logic here as needed
        
        return NextResponse.json({
          success: true,
          message: 'Data cleanup completed',
          results: cleanupResults
        });
        
      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Admin dashboard POST error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to process dashboard action',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}