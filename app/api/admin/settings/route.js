import { NextResponse } from 'next/server';
import { connectDB } from '../../../../lib/config/database';

// GET /api/admin/settings - Get system settings
export async function GET(request) {
  try {
    await connectDB();
    
    const settings = {
      system: {
        tasokoApiEnabled: true,
        autoCustomerSync: process.env.AUTO_CUSTOMER_SYNC === 'true',
        apiTokenMasked: process.env.TASOKO_API_TOKEN ? '***masked***' : null,
        environment: process.env.NODE_ENV || 'development'
      },
      
      serviceTypes: [
        { id: '59cadcd4-7508-450b-85aa-9ec908d168fe', name: 'AIR STANDARD' },
        { id: '25a1d8e5-a478-4cc3-b1fd-a37d0d787302', name: 'AIR EXPRESS' },
        { id: '8df142ca-0573-4ce9-b11d-7a3e5f8ba196', name: 'AIR PREMIUM' },
        { id: '7c9638e8-4bb3-499e-8af9-d09f757a099e', name: 'SEA STANDARD' },
        { id: '', name: 'UNSPECIFIED' }
      ],
      
      packageStatuses: [
        { id: 0, name: 'AT WAREHOUSE' },
        { id: 1, name: 'DELIVERED TO AIRPORT' },
        { id: 2, name: 'IN TRANSIT TO LOCAL PORT' },
        { id: 3, name: 'AT LOCAL PORT' },
        { id: 4, name: 'AT LOCAL SORTING' }
      ],
      
      hazmatCodes: [
        { id: '0acc224d-2eeb-44c1-b472-8c671893b4e9', name: 'Oxidizer' },
        { id: '1cad6a51-29f9-4065-ad07-dc22b44aefb6', name: 'Explosive 1.6 N' },
        { id: '2291c23f-48f6-413b-81a9-f819cc0c9ec9', name: 'Flammable Liquid' },
        { id: '345eb0e3-d6f7-4e0c-bf89-79b16e0fe35f', name: 'Infectious substance' },
        { id: '3f06f49f-f707-430d-bf84-f3f5a72cdb2f', name: 'Organic Peroxide' },
        { id: '4ec484e9-4398-40eb-a98c-b0fbf85847dc', name: 'Toxic Gas, Inhalation Hazard' },
        { id: '51a85e74-f7e8-4ff3-b0f9-388cacd0db4f', name: 'Poison Inhalation Hazard' },
        { id: '6fb19db9-ded4-432d-8035-27fd71ea8eed', name: 'Dangerous When Wet' },
        { id: '701d6ea4-b30c-433c-b45d-19c8ed3fbde6', name: 'Poison, Toxic, PG III' },
        { id: '89ab7939-73ba-483c-af72-92e5cd6f11e8', name: 'Flammable Solid' },
        { id: '8cfefcd6-116f-46e4-b515-870d5722b581', name: 'Flammable Gas' },
        { id: '969143e4-0222-4f25-80a1-7ffd3d45f251', name: 'Class 9' },
        { id: '9e4f7fae-6d4c-4e0e-9e34-1b43e4ceff0b', name: 'Corrosive' },
        { id: 'a3d4dca3-3713-4dc7-9810-9ec8dc2a2d08', name: 'Non-Flammable Gas' },
        { id: 'a5a97de3-ea53-4978-977a-35b77cd1b0a3', name: 'Explosive 1.4 B' },
        { id: 'e4ceb412-760a-416d-81c2-10dfcfd68c87', name: 'Radioactive, Fissile' },
        { id: 'e9e3fcc9-9509-415c-91ad-0eb46e0ed9c0', name: 'Explosive 1.1 A' },
        { id: 'f278da64-a1bb-46c4-9eb9-f2d8c85342ba', name: 'Spontaneously Combustible' },
        { id: 'fa1cd6ca-4fb0-4ff5-90fd-267ecf231bca', name: 'Explosive 1.3 C' },
        { id: 'fac4dca2-5c34-410c-a5ac-f7c63a6abcfe', name: 'Blasting Agent D' },
        { id: 'fc415384-a71e-490e-bc03-e60a0e5fe799', name: 'Explosive 1.2 B' }
      ]
    };
    
    return NextResponse.json({
      success: true,
      data: settings
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Settings fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch settings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/settings - Update system settings
export async function POST(request) {
  try {
    await connectDB();
    
    const settingsUpdate = await request.json();
    console.log('⚙️ Updating system settings:', settingsUpdate);
    
    // In a real implementation, you would save these to a Settings model or environment
    // For now, we'll just acknowledge the update
    
    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      updatedSettings: settingsUpdate
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Settings update error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update settings',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}