const { PrismaClient } = require('@prisma/client');

// Create a singleton instance
let prisma;

if (!prisma) {
    prisma = new PrismaClient({
        errorFormat: 'pretty',
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}

// Handle graceful shutdown
const gracefulShutdown = async () => {
    if (prisma) {
        await prisma.$disconnect();
    }
};

process.on('beforeExit', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = prisma;