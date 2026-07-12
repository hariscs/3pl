-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'lead', 'customer');

-- CreateEnum
CREATE TYPE "LoadStatus" AS ENUM ('active', 'complete', 'void', 'archived');

-- CreateEnum
CREATE TYPE "CheckInStatus" AS ENUM ('active', 'completed');

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "code" TEXT,
    "group" TEXT,
    "addressL1" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/New_York',
    "status" TEXT NOT NULL DEFAULT 'active',
    "containerFields" JSONB,
    "permissions" JSONB,
    "featureFlags" JSONB,
    "shiftStart" TEXT NOT NULL DEFAULT '08:00',
    "shiftEnd" TEXT NOT NULL DEFAULT '17:00',

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "legalCompanyName" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "locationId" TEXT NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',
    "customerId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,

    CONSTRAINT "ProductType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLine" (
    "id" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "billBase" DOUBLE PRECISION NOT NULL,
    "billThreshold" DOUBLE PRECISION NOT NULL,
    "billOverRate" DOUBLE PRECISION NOT NULL,
    "payThreshold" DOUBLE PRECISION NOT NULL,
    "payOverRate" DOUBLE PRECISION NOT NULL,
    "payBonus" DOUBLE PRECISION NOT NULL,
    "productTypeId" TEXT NOT NULL,

    CONSTRAINT "RateLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Load" (
    "id" TEXT NOT NULL,
    "ticketNumber" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "doorNumber" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "vendor" TEXT NOT NULL,
    "poNumbers" TEXT[],
    "sorts" INTEGER NOT NULL,
    "cases" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,
    "status" "LoadStatus" NOT NULL DEFAULT 'active',
    "billedAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payoutAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "locationId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productTypeId" TEXT NOT NULL,

    CONSTRAINT "Load_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoadEmployeeAssignment" (
    "id" TEXT NOT NULL,
    "clockIn" TEXT NOT NULL,
    "clockOut" TEXT,
    "loadId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "LoadEmployeeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'lead',
    "locationId" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "SystemUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "loginId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Lead Supervisor',
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignment" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Lead Supervisor',
    "shiftStart" TEXT NOT NULL DEFAULT '08:00',
    "shiftEnd" TEXT NOT NULL DEFAULT '17:00',
    "distanceMiles" DOUBLE PRECISION,

    CONSTRAINT "LeadAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "status" "CheckInStatus" NOT NULL DEFAULT 'active',
    "deviceId" TEXT,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" TIMESTAMP(3),

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CustomerToLocation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CustomerToLocation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Location_code_key" ON "Location"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Load_ticketNumber_key" ON "Load"("ticketNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SystemUser_email_key" ON "SystemUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_loginId_key" ON "Lead"("loginId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadAssignment_leadId_locationId_key" ON "LeadAssignment"("leadId", "locationId");

-- CreateIndex
CREATE INDEX "_CustomerToLocation_B_index" ON "_CustomerToLocation"("B");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductType" ADD CONSTRAINT "ProductType_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductType" ADD CONSTRAINT "ProductType_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateLine" ADD CONSTRAINT "RateLine_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Load" ADD CONSTRAINT "Load_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "ProductType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadEmployeeAssignment" ADD CONSTRAINT "LoadEmployeeAssignment_loadId_fkey" FOREIGN KEY ("loadId") REFERENCES "Load"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoadEmployeeAssignment" ADD CONSTRAINT "LoadEmployeeAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignment" ADD CONSTRAINT "LeadAssignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToLocation" ADD CONSTRAINT "_CustomerToLocation_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerToLocation" ADD CONSTRAINT "_CustomerToLocation_B_fkey" FOREIGN KEY ("B") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
