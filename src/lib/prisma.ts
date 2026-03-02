import "dotenv/config";
import { PrismaClient } from "@/generated/prisma";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaTiDBCloud } from "@tidbcloud/prisma-adapter";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const adapter = new PrismaTiDBCloud({
        host: process.env.DB_HOST!,
        username: process.env.DB_USER!,
        password: process.env.DB_PASSWORD!,
        database: process.env.DB_NAME!,
    });
    return new PrismaClient({ adapter, log: ["error"] });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
