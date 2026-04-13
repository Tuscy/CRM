import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email =
    process.env.STAFF_SEED_EMAIL?.trim().toLowerCase() ?? "admin@example.com";
  const password = process.env.STAFF_SEED_PASSWORD ?? "changeme";
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: "Admin",
      isStaff: true,
      passwordHash: hash,
    },
    update: {
      isStaff: true,
      passwordHash: hash,
    },
  });

  console.log(`Staff user ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
