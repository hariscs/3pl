import path from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaClient, type Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { calculateLoadAmounts, type RateLineInput } from '../src/lib/billing'

try {
  process.loadEnvFile(path.join(__dirname, '..', '.env'))
} catch {
  // env may be provided directly (CI).
}

const adapter = new PrismaPg(process.env.DATABASE_URL as string)
const prisma = new PrismaClient({ adapter })

type SeedStatus = 'active' | 'archived'
type SeedLoadStatus = 'active' | 'complete' | 'void' | 'archived'
type SeedRole = 'admin' | 'lead' | 'customer'

// Shared lead field-app config applied to every location.
const containerFields: Prisma.InputJsonValue = {
  containerNumberRequired: true,
  casesRequired: true,
  weightRequired: true,
  sortsRequired: true,
  notesEnabled: true,
  photosEnabled: true,
}
const permissions: Prisma.InputJsonValue = {
  canStartLoad: true,
  canCloseLoad: true,
  canEditLoad: true,
  canClockEmployees: true,
  canViewPayRates: false,
  canViewBillingRates: false,
}
const featureFlags: Prisma.InputJsonValue = {
  photoCapture: true,
  breakTracking: false,
  offlineMode: true,
}

const locations = [
  { id: 'loc-savannah', name: 'Savannah, GA', region: 'Southeast', code: 'SAV', addressL1: '9 Port Blvd', city: 'Savannah', state: 'GA', postalCode: '31401', distanceMiles: 4.1 },
  { id: 'loc-charlotte', name: 'Charlotte, NC', region: 'Southeast', code: 'CLT', addressL1: '118 Freight Rd', city: 'Charlotte', state: 'NC', postalCode: '28201', distanceMiles: 2.3 },
  { id: 'loc-dallas', name: 'Dallas, TX', region: 'South Central', code: 'DAL', addressL1: '77 Pallet Ln', city: 'Dallas', state: 'TX', postalCode: '75201', distanceMiles: null },
]

const customers: Array<{
  id: string
  contactName: string
  email: string
  phone: string
  displayName: string
  legalCompanyName: string
  locationIds: string[]
  status: SeedStatus
}> = [
  { id: 'cust-geodis', contactName: 'John Reyes', email: 'j.reyes@geodis.com', phone: '(704) 555-0142', displayName: 'Geodis', legalCompanyName: 'Geodis Logistics LLC', locationIds: ['loc-charlotte', 'loc-dallas'], status: 'active' },
  { id: 'cust-crane', contactName: 'Maria Chen', email: 'm.chen@craneworldwide.com', phone: '(912) 555-0198', displayName: 'Crane Worldwide', legalCompanyName: 'Crane Worldwide Logistics LLC', locationIds: ['loc-savannah'], status: 'active' },
  { id: 'cust-ferrero', contactName: 'Sam Patel', email: 's.patel@ferreroretail.com', phone: '(214) 555-0117', displayName: 'Ferrero Retail Group', legalCompanyName: 'Ferrero Retail Group Inc.', locationIds: ['loc-dallas'], status: 'active' },
  { id: 'cust-oldco', contactName: 'Denise Ward', email: 'd.ward@oldco-example.com', phone: '(704) 555-0100', displayName: 'OldCo Distribution', legalCompanyName: 'OldCo Distribution Inc.', locationIds: ['loc-charlotte'], status: 'archived' },
]

const employees: Array<{
  id: string
  name: string
  email: string
  phone: string
  address: string
  hourlyRate: number
  locationId: string
  status: SeedStatus
}> = [
  { id: 'emp-1', name: 'Marcus Bell', email: 'marcus.bell@example.com', phone: '(704) 555-0111', address: '118 Freight Rd, Charlotte, NC', hourlyRate: 17.5, locationId: 'loc-charlotte', status: 'active' },
  { id: 'emp-2', name: 'Ana Ortiz', email: 'ana.ortiz@example.com', phone: '(704) 555-0133', address: '42 Dock St, Charlotte, NC', hourlyRate: 18, locationId: 'loc-charlotte', status: 'active' },
  { id: 'emp-3', name: 'Trevon Hicks', email: 'trevon.hicks@example.com', phone: '(912) 555-0177', address: '9 Port Blvd, Savannah, GA', hourlyRate: 19, locationId: 'loc-savannah', status: 'active' },
  { id: 'emp-4', name: 'Grace Lin', email: 'grace.lin@example.com', phone: '(912) 555-0166', address: '230 Warehouse Way, Savannah, GA', hourlyRate: 18.5, locationId: 'loc-savannah', status: 'active' },
  { id: 'emp-5', name: 'Devon Marsh', email: 'devon.marsh@example.com', phone: '(214) 555-0155', address: '77 Pallet Ln, Dallas, TX', hourlyRate: 17, locationId: 'loc-dallas', status: 'active' },
  { id: 'emp-6', name: 'Priya Nair', email: 'priya.nair@example.com', phone: '(214) 555-0122', address: '310 Sortline Dr, Dallas, TX', hourlyRate: 17.75, locationId: 'loc-dallas', status: 'active' },
  { id: 'emp-7', name: 'Walt Kessler', email: 'walt.kessler@example.com', phone: '(704) 555-0188', address: '5 Loading Ct, Charlotte, NC', hourlyRate: 16.5, locationId: 'loc-charlotte', status: 'archived' },
]

const productTypes: Array<{
  id: string
  customerId: string
  locationId: string
  name: string
  status: SeedStatus
  rateLines: Array<RateLineInput & { id: string }>
}> = [
  { id: 'pt-geodis-reboxing', customerId: 'cust-geodis', locationId: 'loc-charlotte', name: 'Reboxing', status: 'active', rateLines: [
    { id: 'rl-1', unit: 'case', billBase: 200, billThreshold: 2700, billOverRate: 0.1, payThreshold: 2000, payOverRate: 0.05, payBonus: 0 },
    { id: 'rl-2', unit: 'sort', billBase: 0, billThreshold: 5, billOverRate: 10, payThreshold: 5, payOverRate: 4, payBonus: 0 },
  ] },
  { id: 'pt-geodis-pallet', customerId: 'cust-geodis', locationId: 'loc-dallas', name: 'Pallet Building', status: 'active', rateLines: [
    { id: 'rl-3', unit: 'pallet', billBase: 150, billThreshold: 40, billOverRate: 3.5, payThreshold: 40, payOverRate: 1.75, payBonus: 25 },
  ] },
  { id: 'pt-crane-banding', customerId: 'cust-crane', locationId: 'loc-savannah', name: 'Solar Panel Banding', status: 'active', rateLines: [
    { id: 'rl-4', unit: 'case', billBase: 225, billThreshold: 1800, billOverRate: 0.12, payThreshold: 1500, payOverRate: 0.06, payBonus: 0 },
    { id: 'rl-5', unit: 'lb', billBase: 0, billThreshold: 50, billOverRate: 0.02, payThreshold: 50, payOverRate: 0.01, payBonus: 0 },
  ] },
  { id: 'pt-crane-scanning', customerId: 'cust-crane', locationId: 'loc-savannah', name: 'Solar Panel Scanning', status: 'active', rateLines: [
    { id: 'rl-6', unit: 'case', billBase: 175, billThreshold: 1600, billOverRate: 0.09, payThreshold: 1400, payOverRate: 0.045, payBonus: 0 },
  ] },
  { id: 'pt-ferrero-sorting', customerId: 'cust-ferrero', locationId: 'loc-dallas', name: 'Case Sorting', status: 'active', rateLines: [
    { id: 'rl-7', unit: 'case', billBase: 190, billThreshold: 2200, billOverRate: 0.08, payThreshold: 1900, payOverRate: 0.04, payBonus: 0 },
  ] },
  { id: 'pt-crane-legacy-scan', customerId: 'cust-crane', locationId: 'loc-savannah', name: 'Legacy Crate Scanning', status: 'archived', rateLines: [
    { id: 'rl-8', unit: 'case', billBase: 150, billThreshold: 1200, billOverRate: 0.08, payThreshold: 1200, payOverRate: 0.04, payBonus: 0 },
  ] },
]

const loads: Array<{
  id: string
  ticketNumber: number
  date: string
  locationId: string
  customerId: string
  productTypeId: string
  doorNumber: string
  containerNumber: string
  vendor: string
  poNumbers: string[]
  sorts: number
  cases: number
  weight: number
  status: SeedLoadStatus
  assignments: Array<{ employeeId: string; clockIn: string; clockOut: string | null }>
}> = [
  { id: 'load-195', ticketNumber: 195, date: '2026-07-01', locationId: 'loc-charlotte', customerId: 'cust-geodis', productTypeId: 'pt-geodis-reboxing', doorNumber: '12', containerNumber: 'TCLU 884321', vendor: 'Southern Freight Co', poNumbers: ['PO-88213'], sorts: 6, cases: 2840, weight: 3100, status: 'complete', assignments: [{ employeeId: 'emp-1', clockIn: '06:02', clockOut: '13:41' }, { employeeId: 'emp-2', clockIn: '06:05', clockOut: '13:39' }] },
  { id: 'load-200', ticketNumber: 200, date: '2026-07-02', locationId: 'loc-savannah', customerId: 'cust-crane', productTypeId: 'pt-crane-banding', doorNumber: '4', containerNumber: 'MSCU 552190', vendor: 'Coastal Intermodal', poNumbers: ['PO-77410', 'PO-77411'], sorts: 4, cases: 1650, weight: 4200, status: 'complete', assignments: [{ employeeId: 'emp-3', clockIn: '07:00', clockOut: '15:03' }, { employeeId: 'emp-4', clockIn: '07:00', clockOut: '15:01' }] },
  { id: 'load-204', ticketNumber: 204, date: '2026-07-03', locationId: 'loc-dallas', customerId: 'cust-ferrero', productTypeId: 'pt-ferrero-sorting', doorNumber: '9', containerNumber: 'HLXU 213045', vendor: 'Lone Star Carriers', poNumbers: ['PO-91002'], sorts: 3, cases: 2390, weight: 2650, status: 'complete', assignments: [{ employeeId: 'emp-5', clockIn: '08:15', clockOut: '14:52' }] },
  { id: 'load-208', ticketNumber: 208, date: '2026-07-04', locationId: 'loc-charlotte', customerId: 'cust-geodis', productTypeId: 'pt-geodis-pallet', doorNumber: '7', containerNumber: 'GESU 440217', vendor: 'Piedmont Trucking', poNumbers: ['PO-88420'], sorts: 0, cases: 0, weight: 0, status: 'active', assignments: [{ employeeId: 'emp-2', clockIn: '09:00', clockOut: null }] },
  { id: 'load-211', ticketNumber: 211, date: '2026-07-05', locationId: 'loc-savannah', customerId: 'cust-crane', productTypeId: 'pt-crane-scanning', doorNumber: '2', containerNumber: 'TEMU 106688', vendor: 'Coastal Intermodal', poNumbers: ['PO-77502'], sorts: 2, cases: 1120, weight: 1900, status: 'void', assignments: [{ employeeId: 'emp-3', clockIn: '06:30', clockOut: '11:10' }] },
  { id: 'load-212', ticketNumber: 212, date: '2026-07-05', locationId: 'loc-dallas', customerId: 'cust-ferrero', productTypeId: 'pt-ferrero-sorting', doorNumber: '5', containerNumber: 'CMAU 771122', vendor: 'Lone Star Carriers', poNumbers: ['PO-91055'], sorts: 5, cases: 2510, weight: 2800, status: 'complete', assignments: [{ employeeId: 'emp-6', clockIn: '07:45', clockOut: '16:02' }] },
  { id: 'load-206', ticketNumber: 206, date: '2026-06-24', locationId: 'loc-charlotte', customerId: 'cust-oldco', productTypeId: 'pt-geodis-reboxing', doorNumber: '3', containerNumber: 'OLCU 990011', vendor: 'Piedmont Trucking', poNumbers: ['PO-50021'], sorts: 5, cases: 2650, weight: 2900, status: 'archived', assignments: [{ employeeId: 'emp-1', clockIn: '06:00', clockOut: '12:30' }] },
]

const systemUsers: Array<{
  id: string
  name: string
  email: string
  role: SeedRole
  locationId: string
  status: SeedStatus
}> = [
  { id: 'user-admin', name: 'Rick Alvarez', email: 'rick@dockmaster3pl.com', role: 'admin', locationId: 'loc-charlotte', status: 'active' },
  { id: 'user-lead-savannah', name: 'Josie Turner', email: 'josie.turner@example.com', role: 'lead', locationId: 'loc-savannah', status: 'active' },
  { id: 'user-geodis-portal', name: 'John Reyes', email: 'j.reyes@geodis.com', role: 'customer', locationId: 'loc-charlotte', status: 'active' },
]

async function clear(): Promise<void> {
  await prisma.checkIn.deleteMany()
  await prisma.leadAssignment.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.loadEmployeeAssignment.deleteMany()
  await prisma.load.deleteMany()
  await prisma.rateLine.deleteMany()
  await prisma.productType.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.systemUser.deleteMany()
  await prisma.location.deleteMany()
}

async function main(): Promise<void> {
  await clear()

  for (const loc of locations) {
    await prisma.location.create({
      data: {
        id: loc.id,
        name: loc.name,
        region: loc.region,
        code: loc.code,
        addressL1: loc.addressL1,
        city: loc.city,
        state: loc.state,
        postalCode: loc.postalCode,
        containerFields,
        permissions,
        featureFlags,
      },
    })
  }

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        id: customer.id,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        displayName: customer.displayName,
        legalCompanyName: customer.legalCompanyName,
        status: customer.status,
        locations: { connect: customer.locationIds.map((id) => ({ id })) },
      },
    })
  }

  for (const employee of employees) {
    await prisma.employee.create({ data: { ...employee } })
  }

  const rateLinesByProductType = new Map<string, RateLineInput[]>()
  for (const pt of productTypes) {
    rateLinesByProductType.set(pt.id, pt.rateLines)
    await prisma.productType.create({
      data: {
        id: pt.id,
        name: pt.name,
        status: pt.status,
        customerId: pt.customerId,
        locationId: pt.locationId,
        rateLines: {
          create: pt.rateLines.map((rl) => ({
            id: rl.id,
            unit: rl.unit,
            billBase: rl.billBase,
            billThreshold: rl.billThreshold,
            billOverRate: rl.billOverRate,
            payThreshold: rl.payThreshold,
            payOverRate: rl.payOverRate,
            payBonus: rl.payBonus,
          })),
        },
      },
    })
  }

  for (const load of loads) {
    const rateLines = rateLinesByProductType.get(load.productTypeId) ?? []
    const amounts =
      load.status === 'complete'
        ? calculateLoadAmounts(rateLines, {
            cases: load.cases,
            sorts: load.sorts,
            weight: load.weight,
          })
        : { billed: 0, payout: 0 }

    await prisma.load.create({
      data: {
        id: load.id,
        ticketNumber: load.ticketNumber,
        date: load.date,
        doorNumber: load.doorNumber,
        containerNumber: load.containerNumber,
        vendor: load.vendor,
        poNumbers: load.poNumbers,
        sorts: load.sorts,
        cases: load.cases,
        weight: load.weight,
        status: load.status,
        billedAmount: amounts.billed,
        payoutAmount: amounts.payout,
        locationId: load.locationId,
        customerId: load.customerId,
        productTypeId: load.productTypeId,
        assignments: {
          create: load.assignments.map((a) => ({
            employeeId: a.employeeId,
            clockIn: a.clockIn,
            clockOut: a.clockOut,
          })),
        },
      },
    })
  }

  for (const user of systemUsers) {
    await prisma.systemUser.create({ data: { ...user } })
  }

  // Lead field app: one lead assigned to every location for check-in.
  const lead = await prisma.lead.create({
    data: {
      loginId: 'lead-001',
      name: 'Mike Johnson',
      role: 'Lead Supervisor',
      passwordHash: await bcrypt.hash('1234', 10),
    },
  })
  for (const loc of locations) {
    await prisma.leadAssignment.create({
      data: {
        leadId: lead.id,
        locationId: loc.id,
        distanceMiles: loc.distanceMiles,
      },
    })
  }

  console.log(
    `Seeded ${locations.length} locations, ${customers.length} customers, ${employees.length} employees, ${productTypes.length} product types, ${loads.length} loads, ${systemUsers.length} users, and Lead "${lead.loginId}" (password: 1234).`
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
