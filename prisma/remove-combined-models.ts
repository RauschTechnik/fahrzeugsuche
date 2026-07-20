import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const combined = await prisma.carModel.findMany({
    where: { OR: [{ name: { contains: ' oder ' } }, { name: { contains: ' o. ' } }] },
    include: { manufacturer: true }
  });

  for (const model of combined) {
    const deletedCompatibilities = await prisma.compatibility.deleteMany({ where: { carModelId: model.id } });
    await prisma.carModel.delete({ where: { id: model.id } });
    console.log(
      `Removed "${model.manufacturer.name} ${model.name}" (${deletedCompatibilities.count} compatibility rows)`
    );
  }

  console.log(`\nTotal removed: ${combined.length} combined/duplicate car models.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
