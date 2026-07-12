import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create departments
  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { name: 'Information Technology', code: 'IT' },
  })

  const opsDept = await prisma.department.upsert({
    where: { code: 'OPS' },
    update: {},
    create: { name: 'Operations', code: 'OPS' },
  })

  const finDept = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Finance', code: 'FIN' },
  })

  // Create asset categories
  const electronics = await prisma.assetCategory.upsert({
    where: { name: 'Electronics' },
    update: {},
    create: { name: 'Electronics', description: 'Computers, phones, and electronic devices', warrantyPeriod: 24 },
  })

  const furniture = await prisma.assetCategory.upsert({
    where: { name: 'Furniture' },
    update: {},
    create: { name: 'Furniture', description: 'Office furniture and fixtures', warrantyPeriod: 60 },
  })

  const vehicles = await prisma.assetCategory.upsert({
    where: { name: 'Vehicles' },
    update: {},
    create: { name: 'Vehicles', description: 'Company vehicles and transport', warrantyPeriod: 36 },
  })

  const equipment = await prisma.assetCategory.upsert({
    where: { name: 'Equipment' },
    update: {},
    create: { name: 'Equipment', description: 'Industrial and office equipment', warrantyPeriod: 12 },
  })

  // Hash passwords
  const adminHash = await bcrypt.hash('Admin@123', 12)
  const managerHash = await bcrypt.hash('Manager@123', 12)
  const headHash = await bcrypt.hash('Head@123', 12)
  const empHash = await bcrypt.hash('Employee@123', 12)

  // Create users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@assetflow.com' },
    update: {},
    create: {
      email: 'admin@assetflow.com',
      password: adminHash,
      name: 'System Administrator',
      role: 'ADMIN',
      departmentId: itDept.id,
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: 'manager@assetflow.com' },
    update: {},
    create: {
      email: 'manager@assetflow.com',
      password: managerHash,
      name: 'Asset Manager',
      role: 'ASSET_MANAGER',
      departmentId: itDept.id,
    },
  })

  const head = await prisma.user.upsert({
    where: { email: 'head@assetflow.com' },
    update: {},
    create: {
      email: 'head@assetflow.com',
      password: headHash,
      name: 'Department Head',
      role: 'DEPARTMENT_HEAD',
      departmentId: opsDept.id,
    },
  })

  const emp1 = await prisma.user.upsert({
    where: { email: 'emp1@assetflow.com' },
    update: {},
    create: {
      email: 'emp1@assetflow.com',
      password: empHash,
      name: 'Rajesh Kumar',
      role: 'EMPLOYEE',
      departmentId: itDept.id,
    },
  })

  const emp2 = await prisma.user.upsert({
    where: { email: 'emp2@assetflow.com' },
    update: {},
    create: {
      email: 'emp2@assetflow.com',
      password: empHash,
      name: 'Priya Sharma',
      role: 'EMPLOYEE',
      departmentId: finDept.id,
    },
  })

  // Create sample assets
  const assetsData = [
    {
      assetTag: 'AF-0001',
      name: 'Dell Laptop XPS 15',
      serialNumber: 'SN-DELL-001',
      categoryId: electronics.id,
      acquisitionDate: new Date('2023-01-15'),
      acquisitionCost: 85000,
      condition: 'GOOD' as const,
      location: 'IT Lab, Floor 3',
      departmentId: itDept.id,
      status: 'ALLOCATED' as const,
      isBookable: false,
    },
    {
      assetTag: 'AF-0002',
      name: 'HP LaserJet Printer',
      serialNumber: 'SN-HP-002',
      categoryId: electronics.id,
      acquisitionDate: new Date('2022-06-20'),
      acquisitionCost: 25000,
      condition: 'GOOD' as const,
      location: 'Office Floor 2',
      departmentId: opsDept.id,
      status: 'AVAILABLE' as const,
      isBookable: true,
    },
    {
      assetTag: 'AF-0003',
      name: 'Conference Room Projector',
      serialNumber: 'SN-PROJ-003',
      categoryId: electronics.id,
      acquisitionDate: new Date('2022-03-10'),
      acquisitionCost: 45000,
      condition: 'EXCELLENT' as const,
      location: 'Conference Room A',
      status: 'AVAILABLE' as const,
      isBookable: true,
    },
    {
      assetTag: 'AF-0004',
      name: 'Executive Office Chair',
      serialNumber: 'SN-CHAIR-004',
      categoryId: furniture.id,
      acquisitionDate: new Date('2021-09-05'),
      acquisitionCost: 15000,
      condition: 'GOOD' as const,
      location: 'Management Floor 4',
      departmentId: finDept.id,
      status: 'ALLOCATED' as const,
      isBookable: false,
    },
    {
      assetTag: 'AF-0005',
      name: 'Toyota Innova - Company Vehicle',
      serialNumber: 'MH-01-AB-1234',
      categoryId: vehicles.id,
      acquisitionDate: new Date('2021-12-01'),
      acquisitionCost: 1800000,
      condition: 'GOOD' as const,
      location: 'Basement Parking',
      status: 'AVAILABLE' as const,
      isBookable: true,
    },
    {
      assetTag: 'AF-0006',
      name: 'MacBook Pro 14"',
      serialNumber: 'SN-MAC-006',
      categoryId: electronics.id,
      acquisitionDate: new Date('2023-07-20'),
      acquisitionCost: 165000,
      condition: 'EXCELLENT' as const,
      location: 'IT Department',
      departmentId: itDept.id,
      status: 'AVAILABLE' as const,
      isBookable: false,
    },
    {
      assetTag: 'AF-0007',
      name: 'Industrial UPS 10KVA',
      serialNumber: 'SN-UPS-007',
      categoryId: equipment.id,
      acquisitionDate: new Date('2020-11-15'),
      acquisitionCost: 95000,
      condition: 'FAIR' as const,
      location: 'Server Room',
      departmentId: itDept.id,
      status: 'UNDER_MAINTENANCE' as const,
      isBookable: false,
    },
    {
      assetTag: 'AF-0008',
      name: 'Standing Desk',
      serialNumber: 'SN-DESK-008',
      categoryId: furniture.id,
      acquisitionDate: new Date('2022-08-10'),
      acquisitionCost: 28000,
      condition: 'EXCELLENT' as const,
      location: 'Open Office',
      departmentId: opsDept.id,
      status: 'AVAILABLE' as const,
      isBookable: false,
    },
    {
      assetTag: 'AF-0009',
      name: 'iPad Pro 12.9"',
      serialNumber: 'SN-IPAD-009',
      categoryId: electronics.id,
      acquisitionDate: new Date('2023-04-05'),
      acquisitionCost: 90000,
      condition: 'EXCELLENT' as const,
      location: 'Finance Dept',
      departmentId: finDept.id,
      status: 'ALLOCATED' as const,
      isBookable: false,
    },
    {
      assetTag: 'AF-0010',
      name: 'Water Dispenser',
      serialNumber: 'SN-WD-010',
      categoryId: equipment.id,
      acquisitionDate: new Date('2021-05-20'),
      acquisitionCost: 12000,
      condition: 'GOOD' as const,
      location: 'Pantry Area',
      status: 'AVAILABLE' as const,
      isBookable: false,
    },
  ]

  const createdAssets: { id: string; assetTag: string }[] = []
  for (const assetData of assetsData) {
    const asset = await prisma.asset.upsert({
      where: { assetTag: assetData.assetTag },
      update: {},
      create: assetData,
    })
    createdAssets.push({ id: asset.id, assetTag: asset.assetTag })
  }

  // Create sample allocations
  const asset1 = createdAssets.find(a => a.assetTag === 'AF-0001')
  const asset4 = createdAssets.find(a => a.assetTag === 'AF-0004')
  const asset9 = createdAssets.find(a => a.assetTag === 'AF-0009')

  if (asset1) {
    await prisma.allocation.upsert({
      where: { id: 'alloc-001' },
      update: {},
      create: {
        id: 'alloc-001',
        assetId: asset1.id,
        userId: emp1.id,
        conditionOut: 'GOOD',
        expectedReturn: new Date('2024-12-31'),
        status: 'ACTIVE',
      },
    }).catch(() => {
      return prisma.allocation.create({
        data: {
          assetId: asset1.id,
          userId: emp1.id,
          conditionOut: 'GOOD',
          expectedReturn: new Date('2024-12-31'),
          status: 'ACTIVE',
        },
      })
    })
  }

  if (asset4) {
    await prisma.allocation.create({
      data: {
        assetId: asset4.id,
        userId: head.id,
        conditionOut: 'GOOD',
        status: 'ACTIVE',
      },
    }).catch(() => {})
  }

  if (asset9) {
    await prisma.allocation.create({
      data: {
        assetId: asset9.id,
        userId: emp2.id,
        conditionOut: 'EXCELLENT',
        status: 'ACTIVE',
      },
    }).catch(() => {})
  }

  // Create maintenance request for AF-0007
  const asset7 = createdAssets.find(a => a.assetTag === 'AF-0007')
  if (asset7) {
    await prisma.maintenanceRequest.create({
      data: {
        assetId: asset7.id,
        raisedById: manager.id,
        description: 'UPS battery backup time reduced significantly. Requires battery replacement.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
      },
    }).catch(() => {})
  }

  // Create a sample booking for projector
  const asset3 = createdAssets.find(a => a.assetTag === 'AF-0003')
  if (asset3) {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowEnd = new Date(tomorrow)
    tomorrowEnd.setHours(tomorrow.getHours() + 2)

    await prisma.booking.create({
      data: {
        assetId: asset3.id,
        userId: emp1.id,
        startTime: tomorrow,
        endTime: tomorrowEnd,
        purpose: 'Team presentation - Q3 Review',
        status: 'UPCOMING',
      },
    }).catch(() => {})
  }

  // Create activity logs
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, action: 'CREATED', entity: 'Asset', details: 'Asset AF-0001 registered' },
      { userId: manager.id, action: 'ALLOCATED', entity: 'Asset', details: 'Dell Laptop assigned to Rajesh Kumar' },
      { userId: emp1.id, action: 'BOOKED', entity: 'Asset', details: 'Conference Projector booked for tomorrow' },
      { userId: manager.id, action: 'MAINTENANCE', entity: 'Asset', details: 'Maintenance request raised for UPS AF-0007' },
    ],
  }).catch(() => {})

  // Create notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: 'System Ready',
        message: 'AssetFlow has been seeded with sample data. You can now explore the system.',
        type: 'INFO',
      },
      {
        userId: manager.id,
        title: 'Maintenance Request',
        message: 'A HIGH priority maintenance request has been raised for UPS AF-0007.',
        type: 'MAINTENANCE',
      },
      {
        userId: emp1.id,
        title: 'Asset Allocated',
        message: 'Dell Laptop XPS 15 (AF-0001) has been allocated to you.',
        type: 'ALLOCATION',
      },
    ],
  }).catch(() => {})

  console.log('Seeding complete!')
  console.log('Demo accounts:')
  console.log('  Admin:   admin@assetflow.com / Admin@123')
  console.log('  Manager: manager@assetflow.com / Manager@123')
  console.log('  Head:    head@assetflow.com / Head@123')
  console.log('  Emp 1:   emp1@assetflow.com / Employee@123')
  console.log('  Emp 2:   emp2@assetflow.com / Employee@123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
