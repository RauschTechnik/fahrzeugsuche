-- CreateTable
CREATE TABLE "Manufacturer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Manufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CarModel" (
    "id" SERIAL NOT NULL,
    "manufacturerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "yearOfProductionSince" INTEGER NOT NULL,
    "yearOfProductionUntil" INTEGER,
    "hybridOrElectricDisclaimer" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CarModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Compatibility" (
    "id" SERIAL NOT NULL,
    "carModelId" INTEGER NOT NULL,
    "loadingPosition" TEXT NOT NULL,
    "productLabel" TEXT NOT NULL,
    "filterGroupLabel" TEXT NOT NULL,
    "wheelchairType" TEXT NOT NULL,
    "isForHeavyWc" BOOLEAN NOT NULL,
    "maxWcLength" INTEGER,
    "maxWcWidth" INTEGER,
    "maxWcHeight" INTEGER,
    "remainingSeats" TEXT NOT NULL,
    "isAdditionalVerificationNeeded" BOOLEAN NOT NULL DEFAULT false,
    "comment" TEXT,

    CONSTRAINT "Compatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Manufacturer_name_key" ON "Manufacturer"("name");

-- AddForeignKey
ALTER TABLE "CarModel" ADD CONSTRAINT "CarModel_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "Manufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compatibility" ADD CONSTRAINT "Compatibility_carModelId_fkey" FOREIGN KEY ("carModelId") REFERENCES "CarModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

