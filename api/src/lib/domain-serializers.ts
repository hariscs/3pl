import type { Prisma, Employee, Location, SystemUser } from '@prisma/client'

type CustomerWithLocations = Prisma.CustomerGetPayload<{
  include: { locations: true }
}>
type ProductTypeWithRateLines = Prisma.ProductTypeGetPayload<{
  include: { rateLines: true }
}>
type LoadWithAssignments = Prisma.LoadGetPayload<{
  include: { assignments: true }
}>
type LeadWithAssignments = Prisma.LeadGetPayload<{
  include: { assignments: true }
}>

export const customerInclude = { locations: true } as const
export const productTypeInclude = { rateLines: true } as const
export const loadInclude = { assignments: true } as const
export const leadInclude = { assignments: true } as const

export function toLocation(loc: Location) {
  return {
    id: loc.id,
    name: loc.name,
    region: loc.region,
    code: loc.code ?? null,
    group: loc.group ?? null,
    addressL1: loc.addressL1 ?? null,
    city: loc.city ?? null,
    state: loc.state ?? null,
    postalCode: loc.postalCode ?? null,
    timezone: loc.timezone,
    status: loc.status,
    shiftStart: loc.shiftStart,
    shiftEnd: loc.shiftEnd,
  }
}

export function toCustomer(customer: CustomerWithLocations) {
  return {
    id: customer.id,
    contactName: customer.contactName,
    email: customer.email,
    phone: customer.phone,
    displayName: customer.displayName,
    legalCompanyName: customer.legalCompanyName,
    locationIds: customer.locations.map((l) => l.id),
    status: customer.status,
  }
}

export function toEmployee(employee: Employee) {
  return {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    address: employee.address,
    hourlyRate: employee.hourlyRate,
    category: employee.category ?? null,
    locationId: employee.locationId,
    status: employee.status,
  }
}

export function toProductType(pt: ProductTypeWithRateLines) {
  return {
    id: pt.id,
    customerId: pt.customerId,
    locationId: pt.locationId,
    name: pt.name,
    rateLines: pt.rateLines.map((rl) => ({
      id: rl.id,
      unit: rl.unit,
      billBase: rl.billBase,
      billThreshold: rl.billThreshold,
      billOverRate: rl.billOverRate,
      payThreshold: rl.payThreshold,
      payOverRate: rl.payOverRate,
      payBonus: rl.payBonus,
    })),
    status: pt.status,
  }
}

export function toLoad(load: LoadWithAssignments) {
  return {
    id: load.id,
    ticketNumber: load.ticketNumber,
    date: load.date,
    locationId: load.locationId,
    customerId: load.customerId,
    productTypeId: load.productTypeId,
    doorNumber: load.doorNumber,
    containerNumber: load.containerNumber,
    vendor: load.vendor,
    poNumbers: load.poNumbers,
    sorts: load.sorts,
    cases: load.cases,
    weight: load.weight,
    assignments: load.assignments.map((a) => ({
      employeeId: a.employeeId,
      clockIn: a.clockIn,
      clockOut: a.clockOut ?? null,
    })),
    status: load.status,
    billedAmount: load.billedAmount,
    payoutAmount: load.payoutAmount,
  }
}

export function toSystemUser(user: SystemUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locationId: user.locationId,
    status: user.status,
  }
}

export function toLead(lead: LeadWithAssignments) {
  return {
    id: lead.id,
    email: lead.email,
    name: lead.name,
    role: lead.role,
    createdAt: lead.createdAt.toISOString(),
    assignments: lead.assignments.map((a) => ({
      locationId: a.locationId,
      role: a.role,
      shiftStart: a.shiftStart,
      shiftEnd: a.shiftEnd,
      distanceMiles: a.distanceMiles ?? null,
    })),
  }
}
