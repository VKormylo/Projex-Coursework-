"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const roles = [
        { name: "Admin", description: "Full system access" },
        { name: "Project Manager", description: "Project/sprint/task management" },
        { name: "Developer", description: "Task execution role" },
    ];
    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: { description: role.description },
            create: role,
        });
    }
}
main()
    .then(async () => prisma.$disconnect())
    .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
});
