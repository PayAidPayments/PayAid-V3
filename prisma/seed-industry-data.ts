import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Comprehensive Industry Sample Data Seeder
 * Seeds sample data for all industry modules
 */
async function seedIndustryData() {
  console.log('🌱 Starting industry sample data seeding...\n')

  // Get the demo tenant
  const tenant = await prisma.tenant.findFirst({
    where: { subdomain: 'demo' },
  })

  if (!tenant) {
    console.error('❌ Demo tenant not found. Please run the main seed script first.')
    process.exit(1)
  }

  const tenantId = tenant.id
  console.log(`✅ Found tenant: ${tenant.name} (${tenantId})\n`)

  // Get existing contacts for relationships
  const contacts = await prisma.contact.findMany({
    where: { tenantId },
    take: 20,
  })

  // Get existing products
  const products = await prisma.product.findMany({
    where: { tenantId },
    take: 10,
  })

  console.log('🌾 Seeding Agriculture Data...')
  await seedAgriculture(tenantId)
  console.log('✅ Agriculture Data seeded\n')

  console.log('🏥 Seeding Healthcare Data...')
  await seedHealthcare(tenantId, contacts)
  console.log('✅ Healthcare Data seeded\n')

  console.log('🎓 Seeding Education Data...')
  await seedEducation(tenantId, contacts)
  console.log('✅ Education Data seeded\n')

  console.log('🏗️ Seeding Construction Data...')
  await seedConstruction(tenantId, contacts)
  console.log('✅ Construction Data seeded\n')

  console.log('🚗 Seeding Automotive Data...')
  await seedAutomotive(tenantId, contacts)
  console.log('✅ Automotive Data seeded\n')

  console.log('💆 Seeding Beauty & Wellness Data...')
  await seedBeauty(tenantId, contacts)
  console.log('✅ Beauty & Wellness Data seeded\n')

  console.log('🏨 Seeding Hospitality Data...')
  await seedHospitality(tenantId, contacts)
  console.log('✅ Hospitality Data seeded\n')

  console.log('⚖️ Seeding Legal Services Data...')
  await seedLegal(tenantId, contacts)
  console.log('✅ Legal Services Data seeded\n')

  console.log('🚚 Seeding Logistics Data...')
  await seedLogistics(tenantId, contacts)
  console.log('✅ Logistics Data seeded\n')

  console.log('🏢 Seeding Real Estate Data...')
  await seedRealEstate(tenantId, contacts)
  console.log('✅ Real Estate Data seeded\n')

  console.log('💰 Seeding Financial Services Data...')
  await seedFinancial(tenantId, contacts)
  console.log('✅ Financial Services Data seeded\n')

  console.log('🎉 Seeding Events Data...')
  await seedEvents(tenantId, contacts)
  console.log('✅ Events Data seeded\n')

  console.log('📦 Seeding Wholesale Data...')
  await seedWholesale(tenantId, contacts)
  console.log('✅ Wholesale Data seeded\n')

  console.log('\n✨ All industry sample data seeded successfully!')
}

// Agriculture
async function seedAgriculture(tenantId: string) {
  const crops = [
    { cropName: 'Wheat', cropType: 'CEREAL', season: 'RABI', area: 10, status: 'GROWING' },
    { cropName: 'Rice', cropType: 'CEREAL', season: 'KHARIF', area: 15, status: 'SOWN' },
    { cropName: 'Tomato', cropType: 'VEGETABLE', season: 'SUMMER', area: 5, status: 'GROWING' },
    { cropName: 'Potato', cropType: 'VEGETABLE', season: 'RABI', area: 8, status: 'PLANNED' },
    { cropName: 'Sugarcane', cropType: 'CEREAL', season: 'KHARIF', area: 20, status: 'GROWING' },
  ]

  for (const crop of crops) {
    const sowingDate = new Date()
    sowingDate.setDate(sowingDate.getDate() - Math.floor(Math.random() * 60))
    const harvestDate = new Date(sowingDate)
    harvestDate.setDate(harvestDate.getDate() + 120)

    await prisma.agricultureCrop.upsert({
      where: { id: `crop-${crop.cropName.toLowerCase()}` },
      update: {},
      create: {
        id: `crop-${crop.cropName.toLowerCase()}`,
        tenantId,
        cropName: crop.cropName,
        cropType: crop.cropType,
        season: crop.season,
        area: crop.area,
        sowingDate,
        expectedHarvestDate: harvestDate,
        status: crop.status,
      },
    })
  }
}

// Healthcare
async function seedHealthcare(tenantId: string, contacts: any[]) {
  // Create patients from contacts
  const patients = []
  for (let i = 0; i < 5; i++) {
    const contact = contacts[i] || contacts[0]
    const patient = await prisma.healthcarePatient.upsert({
      where: { id: `patient-${i + 1}` },
      update: {},
      create: {
        id: `patient-${i + 1}`,
        tenantId,
        contactId: contact.id,
        patientId: `PAT-${String(i + 1).padStart(4, '0')}`,
        fullName: contact.name,
        dateOfBirth: new Date(1980 + i * 5, 0, 1),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-'][i],
      },
    })
    patients.push(patient)
  }

  // Create lab tests
  const labTests = [
    { testName: 'Complete Blood Count', testType: 'BLOOD', status: 'COMPLETED' },
    { testName: 'Blood Sugar (Fasting)', testType: 'BLOOD', status: 'ORDERED' },
    { testName: 'Chest X-Ray', testType: 'XRAY', status: 'SAMPLE_COLLECTED' },
    { testName: 'Urine Analysis', testType: 'URINE', status: 'ORDERED' },
    { testName: 'Lipid Profile', testType: 'BLOOD', status: 'COMPLETED' },
  ]

  for (let i = 0; i < labTests.length; i++) {
    const test = labTests[i]
    const patient = patients[i % patients.length]
    await prisma.healthcareLabTest.upsert({
      where: { id: `labtest-${i + 1}` },
      update: {},
      create: {
        id: `labtest-${i + 1}`,
        tenantId,
        patientId: patient.id,
        testName: test.testName,
        testType: test.testType,
        orderedDate: new Date(),
        status: test.status,
        labName: 'City Diagnostic Lab',
      },
    })
  }

  // Create prescriptions
  for (let i = 0; i < 3; i++) {
    const patient = patients[i]
    await prisma.healthcarePrescription.upsert({
      where: { id: `prescription-${i + 1}` },
      update: {},
      create: {
        id: `prescription-${i + 1}`,
        tenantId,
        patientId: patient.id,
        doctorName: 'Dr. Sharma',
        medications: [
          { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' },
          { name: 'Amoxicillin', dosage: '250mg', frequency: 'Three times daily', duration: '7 days' },
        ],
        instructions: 'Take with food. Complete the full course.',
        status: 'ACTIVE',
      },
    })
  }
}

// Education
async function seedEducation(tenantId: string, contacts: any[]) {
  // Create students
  const students = []
  for (let i = 0; i < 8; i++) {
    const contact = contacts[i] || contacts[0]
    const student = await prisma.educationStudent.upsert({
      where: { id: `student-${i + 1}` },
      update: {},
      create: {
        id: `student-${i + 1}`,
        tenantId,
        contactId: contact.id,
        studentId: `STU-${String(i + 1).padStart(4, '0')}`,
        fullName: contact.name,
        dateOfBirth: new Date(2010 + i, 0, 1),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        parentName: `Parent of ${contact.name}`,
        parentPhone: contact.phone,
        admissionDate: new Date(2024, 0, 1),
        status: 'ACTIVE',
      },
    })
    students.push(student)
  }

  // Create courses
  const courses = [
    { courseCode: 'MATH101', courseName: 'Mathematics', category: 'ACADEMIC', fee: 5000 },
    { courseCode: 'ENG101', courseName: 'English', category: 'ACADEMIC', fee: 4000 },
    { courseCode: 'SCI101', courseName: 'Science', category: 'ACADEMIC', fee: 6000 },
    { courseCode: 'COMP101', courseName: 'Computer Basics', category: 'SKILL', fee: 8000 },
  ]

  for (const course of courses) {
    await prisma.educationCourse.upsert({
      where: { id: `course-${course.courseCode}` },
      update: {},
      create: {
        id: `course-${course.courseCode}`,
        tenantId,
        courseCode: course.courseCode,
        courseName: course.courseName,
        category: course.category,
        duration: 6,
        fee: course.fee,
        instructorName: 'Prof. Kumar',
        status: 'ACTIVE',
      },
    })
  }
}

// Construction
async function seedConstruction(tenantId: string, contacts: any[]) {
  const projects = [
    { name: 'Residential Complex', type: 'RESIDENTIAL', status: 'IN_PROGRESS', budget: 5000000 },
    { name: 'Commercial Building', type: 'COMMERCIAL', status: 'PLANNED', budget: 10000000 },
    { name: 'Road Construction', type: 'INFRASTRUCTURE', status: 'IN_PROGRESS', budget: 3000000 },
  ]

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i]
    const client = contacts[i] || contacts[0]
    await prisma.constructionProject.upsert({
      where: { id: `project-${i + 1}` },
      update: {},
      create: {
        id: `project-${i + 1}`,
        tenantId,
        projectName: project.name,
        projectType: project.type,
        clientName: client.name,
        clientPhone: client.phone,
        location: 'Bangalore',
        startDate: new Date(),
        expectedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        budget: project.budget,
        status: project.status,
      },
    })
  }
}

// Automotive
async function seedAutomotive(tenantId: string, contacts: any[]) {
  // First create vehicles
  const vehicles = []
  for (let i = 0; i < 3; i++) {
    const vehicle = await prisma.automotiveVehicle.upsert({
      where: { id: `vehicle-${i + 1}` },
      update: {},
      create: {
        id: `vehicle-${i + 1}`,
        tenantId,
        vehicleNumber: `KA-0${i + 1}-AB-${String(1234 + i).padStart(4, '0')}`,
        vehicleType: 'CAR',
        vehicleMake: 'MARUTI',
        vehicleModel: 'Swift',
        vehicleYear: 2020 + i,
        customerName: contacts[i]?.name || 'Customer',
      },
    })
    vehicles.push(vehicle)
  }

  const jobCards = [
    { serviceType: 'REGULAR', status: 'IN_PROGRESS' },
    { serviceType: 'REPAIR', status: 'OPEN' },
    { serviceType: 'REGULAR', status: 'COMPLETED' },
  ]

  for (let i = 0; i < jobCards.length; i++) {
    const job = jobCards[i]
    const customer = contacts[i] || contacts[0]
    const vehicle = vehicles[i]
    await prisma.automotiveJobCard.upsert({
      where: { id: `jobcard-${i + 1}` },
      update: {},
      create: {
        id: `jobcard-${i + 1}`,
        tenantId,
        vehicleId: vehicle.id,
        jobCardNumber: `JC-${String(i + 1).padStart(4, '0')}`,
        vehicleNumber: vehicle.vehicleNumber,
        customerName: customer.name,
        serviceType: job.serviceType,
        status: job.status,
        estimatedCost: 5000 + i * 1000,
      },
    })
  }
}

// Beauty & Wellness
async function seedBeauty(tenantId: string, contacts: any[]) {
  // First create services
  const services = []
  const serviceNames = ['Hair Cut', 'Facial Treatment', 'Massage Therapy']
  for (let i = 0; i < serviceNames.length; i++) {
    const service = await prisma.beautyService.upsert({
      where: { id: `service-${i + 1}` },
      update: {},
      create: {
        id: `service-${i + 1}`,
        tenantId,
        serviceName: serviceNames[i],
        serviceCategory: 'HAIR',
        duration: 60,
        price: 500 + i * 200,
        isActive: true,
      },
    })
    services.push(service)
  }

  const appointments = [
    { status: 'CONFIRMED' },
    { status: 'COMPLETED' },
    { status: 'SCHEDULED' },
  ]

  for (let i = 0; i < appointments.length; i++) {
    const appt = appointments[i]
    const customer = contacts[i] || contacts[0]
    const appointmentDate = new Date()
    appointmentDate.setDate(appointmentDate.getDate() + i)

    await prisma.beautyAppointment.upsert({
      where: { id: `appointment-${i + 1}` },
      update: {},
      create: {
        id: `appointment-${i + 1}`,
        tenantId,
        serviceId: services[i].id,
        serviceName: services[i].serviceName,
        customerName: customer.name,
        customerPhone: customer.phone,
        appointmentDate,
        duration: 60,
        status: appt.status,
        amount: 500 + i * 200,
      },
    })
  }
}

// Hospitality
async function seedHospitality(tenantId: string, contacts: any[]) {
  // First create rooms
  const rooms = []
  const roomTypes = ['SINGLE', 'DOUBLE', 'SUITE']
  for (let i = 0; i < roomTypes.length; i++) {
    const room = await prisma.hospitalityRoom.upsert({
      where: { id: `room-${i + 1}` },
      update: {},
      create: {
        id: `room-${i + 1}`,
        tenantId,
        roomNumber: `R${String(i + 1).padStart(3, '0')}`,
        roomType: roomTypes[i],
        capacity: roomTypes[i] === 'SINGLE' ? 1 : roomTypes[i] === 'DOUBLE' ? 2 : 4,
        pricePerNight: roomTypes[i] === 'SUITE' ? 5000 : roomTypes[i] === 'DOUBLE' ? 3000 : 2000,
        status: 'AVAILABLE',
      },
    })
    rooms.push(room)
  }

  const bookings = [
    { status: 'CONFIRMED' },
    { status: 'CHECKED_IN' },
    { status: 'CONFIRMED' },
  ]

  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i]
    const guest = contacts[i] || contacts[0]
    const room = rooms[i]
    const checkIn = new Date()
    checkIn.setDate(checkIn.getDate() + i)
    const checkOut = new Date(checkIn)
    checkOut.setDate(checkOut.getDate() + 2)

    await prisma.hospitalityBooking.upsert({
      where: { id: `booking-${i + 1}` },
      update: {},
      create: {
        id: `booking-${i + 1}`,
        tenantId,
        roomId: room.id,
        guestName: guest.name,
        guestPhone: guest.phone,
        guestEmail: guest.email,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: room.capacity,
        roomRate: room.pricePerNight,
        totalAmount: Number(room.pricePerNight) * 2,
        status: booking.status,
      },
    })
  }
}

// Legal Services
async function seedLegal(tenantId: string, contacts: any[]) {
  const cases = [
    { caseType: 'CIVIL', status: 'OPEN' },
    { caseType: 'CRIMINAL', status: 'IN_PROGRESS' },
    { caseType: 'CORPORATE', status: 'OPEN' },
  ]

  for (let i = 0; i < cases.length; i++) {
    const caseData = cases[i]
    const client = contacts[i] || contacts[0]
    await prisma.legalCase.upsert({
      where: { id: `case-${i + 1}` },
      update: {},
      create: {
        id: `case-${i + 1}`,
        tenantId,
        caseNumber: `CASE-${String(i + 1).padStart(4, '0')}`,
        caseType: caseData.caseType,
        clientName: client.name,
        caseTitle: `${caseData.caseType} Case ${i + 1}`,
        description: `Legal case description for ${caseData.caseType}`,
        status: caseData.status,
        filingDate: new Date(),
      },
    })
  }
}

// Logistics
async function seedLogistics(tenantId: string, contacts: any[]) {
  const shipments = [
    { status: 'IN_TRANSIT', shipmentType: 'EXPRESS' },
    { status: 'DELIVERED', shipmentType: 'STANDARD' },
    { status: 'PENDING', shipmentType: 'STANDARD' },
  ]

  for (let i = 0; i < shipments.length; i++) {
    const shipment = shipments[i]
    const customer = contacts[i] || contacts[0]
    await prisma.logisticsShipment.upsert({
      where: { id: `shipment-${i + 1}` },
      update: {},
      create: {
        id: `shipment-${i + 1}`,
        tenantId,
        shipmentNumber: `SHIP-${String(i + 1).padStart(6, '0')}`,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerAddress: customer.address || 'Customer Address',
        pickupAddress: 'Warehouse, Bangalore',
        deliveryAddress: customer.address || 'Customer Address',
        shipmentType: shipment.shipmentType,
        weight: 10 + i * 5,
        status: shipment.status,
      },
    })
  }
}

// Real Estate
async function seedRealEstate(tenantId: string, contacts: any[]) {
  const leads = [
    { propertyType: 'APARTMENT', status: 'NEW', budget: 5000000 },
    { propertyType: 'VILLA', status: 'CONTACTED', budget: 15000000 },
    { propertyType: 'PLOT', status: 'QUALIFIED', budget: 3000000 },
  ]

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i]
    const contact = contacts[i] || contacts[0]
    await prisma.realEstateLead.upsert({
      where: { id: `lead-${i + 1}` },
      update: {},
      create: {
        id: `lead-${i + 1}`,
        tenantId,
        contactId: contact.id,
        leadType: 'BUYER',
        propertyType: lead.propertyType,
        location: 'Bangalore',
        budget: lead.budget,
        status: lead.status,
        source: 'WEBSITE',
      },
    })
  }
}

// Financial Services
async function seedFinancial(tenantId: string, contacts: any[]) {
  // First create financial clients
  const clients = []
  for (let i = 0; i < 3; i++) {
    const contact = contacts[i] || contacts[0]
    const client = await prisma.financialClient.upsert({
      where: { id: `financial-client-${i + 1}` },
      update: {},
      create: {
        id: `financial-client-${i + 1}`,
        tenantId,
        clientName: contact.name,
        clientType: 'INDIVIDUAL',
        panNumber: 'ABCDE1234F',
        phone: contact.phone,
        email: contact.email,
      },
    })
    clients.push(client)
  }

  const taxFilings = [
    { filingType: 'ITR1', status: 'PENDING', financialYear: '2024-25' },
    { filingType: 'ITR2', status: 'FILED', financialYear: '2024-25' },
    { filingType: 'ITR3', status: 'PENDING', financialYear: '2024-25' },
  ]

  for (let i = 0; i < taxFilings.length; i++) {
    const filing = taxFilings[i]
    const client = clients[i]
    await prisma.financialTaxFiling.upsert({
      where: { id: `filing-${i + 1}` },
      update: {},
      create: {
        id: `filing-${i + 1}`,
        tenantId,
        clientId: client.id,
        filingType: filing.filingType,
        financialYear: filing.financialYear,
        assessmentYear: '2025-26',
        dueDate: new Date(2025, 6, 31),
        status: filing.status,
        taxAmount: 50000 + i * 10000,
      },
    })
  }
}

// Events
async function seedEvents(tenantId: string, contacts: any[]) {
  const events = [
    { eventName: 'Corporate Conference', status: 'DRAFT' },
    { eventName: 'Wedding Reception', status: 'PUBLISHED' },
    { eventName: 'Product Launch', status: 'DRAFT' },
  ]

  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + i * 7)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 1)

    await prisma.eventManagementEvent.upsert({
      where: { id: `event-${i + 1}` },
      update: {},
      create: {
        id: `event-${i + 1}`,
        tenantId,
        eventName: event.eventName,
        eventType: 'CORPORATE',
        startDate,
        endDate,
        venue: 'Convention Center, Bangalore',
        expectedAttendees: 100 + i * 50,
        status: event.status,
        budget: 100000 + i * 50000,
      },
    })
  }
}

// Wholesale
async function seedWholesale(tenantId: string, contacts: any[]) {
  const customers = [
    { customerType: 'RETAILER', status: 'ACTIVE' },
    { customerType: 'DISTRIBUTOR', status: 'ACTIVE' },
    { customerType: 'BULK_BUYER', status: 'ACTIVE' },
  ]

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i]
    const contact = contacts[i] || contacts[0]
    await prisma.wholesaleCustomer.upsert({
      where: { id: `wholesale-customer-${i + 1}` },
      update: {},
      create: {
        id: `wholesale-customer-${i + 1}`,
        tenantId,
        contactId: contact.id,
        customerCode: `WC-${String(i + 1).padStart(4, '0')}`,
        businessName: contact.company || contact.name,
        contactName: contact.name,
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        customerType: customer.customerType,
        creditLimit: 100000 + i * 50000,
        status: customer.status,
      },
    })
  }
}

// Run the seeder
seedIndustryData()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

