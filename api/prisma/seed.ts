import path from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaClient, type Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'))
} catch {
  // env may be provided directly (CI).
}

const adapter = new PrismaPg(process.env.DATABASE_URL as string)
const prisma = new PrismaClient({ adapter })

interface RuleSpec {
  key: string
  type: string
  rate: number
}
interface ProductSpec {
  name: string
  payKey?: string
  billKey?: string
}
interface CustomerSpec {
  name: string
  status?: string
  products: ProductSpec[]
}
interface EmployeeSpec {
  name: string
  employeeCode: string
  status?: string
}
interface ContactSpec {
  name: string
  role: string
  phone: string
}
interface LoadSpec {
  customerName?: string
  status: 'active' | 'completed'
  containerNumber?: string
  cases?: number
  weight?: number
  sorts?: number
  notes?: string
  daysAgo?: number
}
interface LocationSpec {
  name: string
  code: string
  group: string
  addressL1: string
  city: string
  state: string
  postalCode: string
  timezone: string
  shiftStart: string
  shiftEnd: string
  distanceMiles: number | null
  containerFields: Prisma.InputJsonValue
  permissions: Prisma.InputJsonValue
  featureFlags: Prisma.InputJsonValue
  payRules: RuleSpec[]
  billingRules: RuleSpec[]
  customers: CustomerSpec[]
  employees: EmployeeSpec[]
  contacts: ContactSpec[]
  loads: LoadSpec[]
}

const defaultContainerFields: Prisma.InputJsonValue = {
  containerNumberRequired: true,
  casesRequired: true,
  weightRequired: true,
  sortsRequired: true,
  notesEnabled: true,
  photosEnabled: true,
}

const locationSpecs: LocationSpec[] = [
  {
    name: 'Dallas Warehouse 4',
    code: 'DAL-WH-04',
    group: 'Dallas Warehouse Group',
    addressL1: '1234 Logistics Parkway',
    city: 'Dallas',
    state: 'TX',
    postalCode: '75201',
    timezone: 'America/Chicago',
    shiftStart: '08:00',
    shiftEnd: '17:00',
    distanceMiles: 3.2,
    containerFields: defaultContainerFields,
    permissions: {
      canStartLoad: true,
      canCloseLoad: true,
      canEditLoad: true,
      canClockEmployees: true,
      canViewPayRates: false,
      canViewBillingRates: false,
    },
    featureFlags: { photoCapture: true, breakTracking: false, offlineMode: true },
    payRules: [
      { key: 'pay-frozen', type: 'per_case', rate: 0.06 },
      { key: 'pay-dry', type: 'per_case', rate: 0.05 },
    ],
    billingRules: [
      { key: 'bill-frozen', type: 'per_case', rate: 0.11 },
      { key: 'bill-dry', type: 'per_case', rate: 0.09 },
    ],
    customers: [
      {
        name: 'Amazon DC12',
        products: [
          { name: 'Frozen Chicken', payKey: 'pay-frozen', billKey: 'bill-frozen' },
          { name: 'Dry Goods', payKey: 'pay-dry', billKey: 'bill-dry' },
        ],
      },
      {
        name: 'Kroger Cold Storage',
        products: [
          { name: 'Frozen Vegetables', payKey: 'pay-frozen', billKey: 'bill-frozen' },
        ],
      },
    ],
    employees: [
      { name: 'John Smith', employeeCode: 'EMP-DAL4-001' },
      { name: 'Maria Garcia', employeeCode: 'EMP-DAL4-002' },
      { name: 'David Lee', employeeCode: 'EMP-DAL4-003', status: 'clocked_in' },
    ],
    contacts: [
      { name: 'Sarah Williams', role: 'Warehouse Manager', phone: '+1 555 010 2200' },
    ],
    loads: [
      {
        customerName: 'Amazon DC12',
        status: 'active',
        containerNumber: 'CONT-DAL4-9001',
        cases: 420,
        weight: 18500,
        sorts: 3,
        notes: 'In progress',
      },
      {
        customerName: 'Kroger Cold Storage',
        status: 'completed',
        containerNumber: 'CONT-DAL4-8800',
        cases: 610,
        weight: 22000,
        sorts: 4,
        daysAgo: 1,
      },
    ],
  },
  {
    name: 'Dallas Warehouse 6',
    code: 'DAL-WH-06',
    group: 'Dallas Warehouse Group',
    addressL1: '8600 Industrial Drive',
    city: 'Dallas',
    state: 'TX',
    postalCode: '75212',
    timezone: 'America/Chicago',
    shiftStart: '07:00',
    shiftEnd: '15:30',
    distanceMiles: 7.8,
    containerFields: { ...(defaultContainerFields as object), sortsRequired: false } as Prisma.InputJsonValue,
    permissions: {
      canStartLoad: true,
      canCloseLoad: true,
      canEditLoad: false,
      canClockEmployees: true,
      canViewPayRates: true,
      canViewBillingRates: false,
    },
    featureFlags: { photoCapture: false, breakTracking: true, offlineMode: true },
    payRules: [{ key: 'pay-hourly', type: 'hourly', rate: 18.5 }],
    billingRules: [{ key: 'bill-hourly', type: 'hourly', rate: 32.0 }],
    customers: [
      {
        name: 'Walmart RDC 7',
        products: [
          { name: 'Palletized Grocery', payKey: 'pay-hourly', billKey: 'bill-hourly' },
          { name: 'Mixed Freight', payKey: 'pay-hourly', billKey: 'bill-hourly' },
        ],
      },
    ],
    employees: [
      { name: 'Robert Chen', employeeCode: 'EMP-DAL6-001' },
      { name: 'Ashley Nguyen', employeeCode: 'EMP-DAL6-002' },
    ],
    contacts: [
      { name: 'James Carter', role: 'Shift Supervisor', phone: '+1 555 010 3300' },
      { name: 'Priya Patel', role: 'Safety Lead', phone: '+1 555 010 3301' },
    ],
    loads: [
      {
        customerName: 'Walmart RDC 7',
        status: 'completed',
        containerNumber: 'CONT-DAL6-4400',
        cases: 0,
        weight: 41000,
        notes: 'Hourly load — no case count',
        daysAgo: 2,
      },
    ],
  },
  {
    name: 'Fort Worth Warehouse',
    code: 'FTW-WH-01',
    group: 'Fort Worth Operations',
    addressL1: '450 Commerce Street',
    city: 'Fort Worth',
    state: 'TX',
    postalCode: '76102',
    timezone: 'America/Chicago',
    shiftStart: '06:00',
    shiftEnd: '14:00',
    distanceMiles: null,
    containerFields: defaultContainerFields,
    permissions: {
      canStartLoad: true,
      canCloseLoad: true,
      canEditLoad: true,
      canClockEmployees: false,
      canViewPayRates: false,
      canViewBillingRates: false,
    },
    featureFlags: { photoCapture: true, breakTracking: true, offlineMode: false },
    payRules: [
      { key: 'pay-produce', type: 'per_case', rate: 0.075 },
    ],
    billingRules: [
      { key: 'bill-produce', type: 'per_case', rate: 0.14 },
    ],
    customers: [
      {
        name: 'Target DC 88',
        products: [
          { name: 'Fresh Produce', payKey: 'pay-produce', billKey: 'bill-produce' },
        ],
      },
      {
        name: 'HEB Distribution',
        products: [
          { name: 'Dairy', payKey: 'pay-produce', billKey: 'bill-produce' },
          { name: 'Bakery', payKey: 'pay-produce', billKey: 'bill-produce' },
        ],
      },
    ],
    employees: [
      { name: 'Carlos Mendez', employeeCode: 'EMP-FTW-001' },
      { name: 'Tanya Brooks', employeeCode: 'EMP-FTW-002' },
      { name: 'Kevin Park', employeeCode: 'EMP-FTW-003' },
      { name: 'Nadia Ali', employeeCode: 'EMP-FTW-004', status: 'off' },
    ],
    contacts: [
      { name: 'Angela Foster', role: 'Warehouse Manager', phone: '+1 555 010 4400' },
    ],
    loads: [],
  },
]

async function clear(): Promise<void> {
  await prisma.checkIn.deleteMany()
  await prisma.load.deleteMany()
  await prisma.product.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.payRule.deleteMany()
  await prisma.billingRule.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.locationContact.deleteMany()
  await prisma.leadAssignment.deleteMany()
  await prisma.location.deleteMany()
  await prisma.lead.deleteMany()
}

async function seedLocation(spec: LocationSpec): Promise<string> {
  const location = await prisma.location.create({
    data: {
      name: spec.name,
      code: spec.code,
      group: spec.group,
      addressL1: spec.addressL1,
      city: spec.city,
      state: spec.state,
      postalCode: spec.postalCode,
      timezone: spec.timezone,
      shiftStart: spec.shiftStart,
      shiftEnd: spec.shiftEnd,
      containerFields: spec.containerFields,
      permissions: spec.permissions,
      featureFlags: spec.featureFlags,
    },
  })

  const payRuleIds = new Map<string, string>()
  for (const rule of spec.payRules) {
    const created = await prisma.payRule.create({
      data: { type: rule.type, rate: rule.rate, locationId: location.id },
    })
    payRuleIds.set(rule.key, created.id)
  }

  const billingRuleIds = new Map<string, string>()
  for (const rule of spec.billingRules) {
    const created = await prisma.billingRule.create({
      data: { type: rule.type, rate: rule.rate, locationId: location.id },
    })
    billingRuleIds.set(rule.key, created.id)
  }

  const customerIds = new Map<string, string>()
  for (const customer of spec.customers) {
    const created = await prisma.customer.create({
      data: {
        name: customer.name,
        status: customer.status ?? 'active',
        locationId: location.id,
        products: {
          create: customer.products.map((product) => ({
            name: product.name,
            payRuleId: product.payKey ? payRuleIds.get(product.payKey) : null,
            billingRuleId: product.billKey ? billingRuleIds.get(product.billKey) : null,
          })),
        },
      },
    })
    customerIds.set(customer.name, created.id)
  }

  for (const employee of spec.employees) {
    await prisma.employee.create({
      data: {
        name: employee.name,
        employeeCode: employee.employeeCode,
        status: employee.status ?? 'available',
        locationId: location.id,
      },
    })
  }

  for (const contact of spec.contacts) {
    await prisma.locationContact.create({
      data: {
        name: contact.name,
        role: contact.role,
        phone: contact.phone,
        locationId: location.id,
      },
    })
  }

  for (const load of spec.loads) {
    const started = new Date()
    if (load.daysAgo) {
      started.setDate(started.getDate() - load.daysAgo)
    }
    await prisma.load.create({
      data: {
        locationId: location.id,
        customerId: load.customerName ? customerIds.get(load.customerName) : null,
        status: load.status,
        containerNumber: load.containerNumber ?? null,
        cases: load.cases ?? null,
        weight: load.weight ?? null,
        sorts: load.sorts ?? null,
        notes: load.notes ?? null,
        startedAt: started,
        completedAt: load.status === 'completed' ? started : null,
      },
    })
  }

  return location.id
}

async function main(): Promise<void> {
  await clear()

  const locationIds: string[] = []
  for (const spec of locationSpecs) {
    locationIds.push(await seedLocation(spec))
  }

  const lead = await prisma.lead.create({
    data: {
      loginId: 'lead-001',
      name: 'Mike Johnson',
      role: 'Lead Supervisor',
      passwordHash: await bcrypt.hash('1234', 10),
    },
  })

  const distances = locationSpecs.map((s) => s.distanceMiles)
  for (const [index, locationId] of locationIds.entries()) {
    const spec = locationSpecs[index]
    await prisma.leadAssignment.create({
      data: {
        leadId: lead.id,
        locationId,
        role: 'Lead Supervisor',
        shiftStart: spec.shiftStart,
        shiftEnd: spec.shiftEnd,
        distanceMiles: distances[index],
      },
    })
  }

  console.log(
    `Seeded ${locationIds.length} locations and Lead "${lead.loginId}" (password: 1234).`
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
