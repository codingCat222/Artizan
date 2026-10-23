import app from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { startJobs } from "./jobs";

async function main() {
    await prisma.$connect();
    console.log("Connected to database");

    startJobs();

    app.listen(env.port, () => {
        console.log(`Server running on http://localhost:${env.port} (${env.nodeEnv})`);
    });
}

main().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});

process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});