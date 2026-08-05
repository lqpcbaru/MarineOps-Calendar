import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.info('Seeding database...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {
      permissionCodes: [
        'user.manage',
        'role.manage',
        'station.read',
        'station.write',
        'calendar.read',
        'calendar.write',
        'alert.read',
        'alert.write',
        'dashboard.read',
        'audit.read',
        'settings.read',
        'settings.write',
        'admin.reference',
      ],
    },
    create: {
      name: 'Admin',
      permissionCodes: [
        'user.manage',
        'role.manage',
        'station.read',
        'station.write',
        'calendar.read',
        'calendar.write',
        'alert.read',
        'alert.write',
        'dashboard.read',
        'audit.read',
        'settings.read',
        'settings.write',
        'admin.reference',
      ],
    },
  });

  await prisma.role.upsert({
    where: { name: 'FisheriesOfficer' },
    update: {},
    create: {
      name: 'FisheriesOfficer',
      permissionCodes: [
        'station.read',
        'calendar.read',
        'alert.read',
        'alert.write',
        'dashboard.read',
        'audit.read',
      ],
    },
  });

  await prisma.role.upsert({
    where: { name: 'Auditor' },
    update: {},
    create: {
      name: 'Auditor',
      permissionCodes: [
        'station.read',
        'calendar.read',
        'alert.read',
        'dashboard.read',
        'audit.read',
        'settings.read',
      ],
    },
  });

  const passwordHash = await argon2.hash('admin-password-123');

  const admin = await prisma.user.upsert({
    where: { email: 'admin@marineops.local' },
    update: {},
    create: {
      email: 'admin@marineops.local',
      name: 'System Admin',
      passwordHash,
      status: 'ACTIVE',
      timezone: 'UTC',
      locale: 'en',
      roles: {
        create: [{ roleId: adminRole.id }],
      },
    },
  });

  console.info(`Seeded roles and admin user ${admin.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
