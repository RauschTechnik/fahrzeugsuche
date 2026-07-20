import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type ImportRow = {
  manufacturerName: string;
  modelName: string;
  yearOfProductionSince: number;
  yearOfProductionUntil: number | null;
  hybridOrElectricDisclaimer: boolean;
  loadingPosition: string;
  productLabel: string;
  filterGroupLabel: string;
  wheelchairType: string;
  isForHeavyWc: boolean;
  maxWcLength: number | null;
  maxWcWidth: number | null;
  maxWcHeight: number | null;
  remainingSeats: string;
  isAdditionalVerificationNeeded: boolean;
  comment: string | null;
};

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-admin-secret');

  if (!process.env.ADMIN_IMPORT_SECRET || secret !== process.env.ADMIN_IMPORT_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const rows: Array<ImportRow> = body.rows ?? [];
  const reset: boolean = body.reset ?? false;

  if (reset) {
    await prisma.compatibility.deleteMany();
    await prisma.carModel.deleteMany();
    await prisma.manufacturer.deleteMany();
  }

  const manufacturerCache = new Map<string, number>();
  const carModelCache = new Map<string, number>();

  let imported = 0;

  for (const row of rows) {
    let manufacturerId = manufacturerCache.get(row.manufacturerName);

    if (manufacturerId == null) {
      const manufacturer = await prisma.manufacturer.upsert({
        where: { name: row.manufacturerName },
        update: {},
        create: { name: row.manufacturerName }
      });
      manufacturerId = manufacturer.id;
      manufacturerCache.set(row.manufacturerName, manufacturerId);
    }

    const carModelKey = `${manufacturerId}|${row.modelName}|${row.yearOfProductionSince}`;
    let carModelId = carModelCache.get(carModelKey);

    if (carModelId == null) {
      const existing = await prisma.carModel.findFirst({
        where: { manufacturerId, name: row.modelName, yearOfProductionSince: row.yearOfProductionSince }
      });

      const carModel =
        existing ??
        (await prisma.carModel.create({
          data: {
            manufacturerId,
            name: row.modelName,
            yearOfProductionSince: row.yearOfProductionSince,
            yearOfProductionUntil: row.yearOfProductionUntil,
            hybridOrElectricDisclaimer: row.hybridOrElectricDisclaimer
          }
        }));

      carModelId = carModel.id;
      carModelCache.set(carModelKey, carModelId);
    }

    await prisma.compatibility.create({
      data: {
        carModelId,
        loadingPosition: row.loadingPosition,
        productLabel: row.productLabel,
        filterGroupLabel: row.filterGroupLabel,
        wheelchairType: row.wheelchairType,
        isForHeavyWc: row.isForHeavyWc,
        maxWcLength: row.maxWcLength,
        maxWcWidth: row.maxWcWidth,
        maxWcHeight: row.maxWcHeight,
        remainingSeats: row.remainingSeats,
        isAdditionalVerificationNeeded: row.isAdditionalVerificationNeeded,
        comment: row.comment
      }
    });

    imported++;
  }

  return NextResponse.json({ imported });
}
