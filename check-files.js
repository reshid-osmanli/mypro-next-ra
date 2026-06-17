const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const files = await prisma.productFile.findMany({ include: { product: true } });
    console.log('Files found:', files.length);
    files.forEach(f => console.log('File:', f.title, '| URL:', f.url, '| Product:', f.product?.title));
    await prisma.$disconnect();
}

main().catch(console.error);