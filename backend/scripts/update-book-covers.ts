import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Production-safe script to update specific book covers and metadata
 * This updates only the specified books without affecting other data
 */
async function updateBookCovers() {
  console.log('📚 Updating book covers for production deployment...');

  try {
    // Update Patriot by Alexei Navalny
    console.log('\n1️⃣ Updating "Patriot" by Alexei Navalny...');
    const patriotResult = await prisma.book.updateMany({
      where: {
        author: 'Alexei Navalny',
        title: 'Patriot',
      },
      data: {
        coverUrl: 'https://books.google.com/books/content?id=w6JREQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
        isbn: '9798217172375',
        totalPages: 753,
        progress: 753,
      },
    });
    console.log(`   ✅ Updated ${patriotResult.count} record(s)`);

    // Update Louise Glück book - handle both old and new titles
    console.log('\n2️⃣ Updating Louise Glück poetry collection...');
    
    // First try to find by old title
    const oldGluckBook = await prisma.book.findFirst({
      where: {
        author: {
          contains: 'Glück',
          mode: 'insensitive',
        },
        OR: [
          { title: 'Things in Nature Merely Grow' },
          { title: 'Poems 1962-2012' },
        ],
      },
    });

    if (oldGluckBook) {
      await prisma.book.update({
        where: { id: oldGluckBook.id },
        data: {
          title: 'Poems 1962-2012',
          coverUrl: 'https://books.google.com/books/content?id=9NmZAwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api',
          isbn: '9781466875623',
          totalPages: 657,
          progress: 657,
        },
      });
      console.log(`   ✅ Updated Louise Glück book (ID: ${oldGluckBook.id})`);
      
      // Update the review if it exists
      const review = await prisma.review.findFirst({
        where: { bookId: oldGluckBook.id },
      });
      
      if (review) {
        await prisma.review.update({
          where: { id: review.id },
          data: {
            content: "Glück's poetry is spare, precise, and deeply profound. Each poem feels like a meditation on existence, loss, and the natural world. This collected works spans 50 years of her extraordinary career.",
          },
        });
        console.log(`   ✅ Updated review text`);
      }
    } else {
      console.log('   ⚠️  Louise Glück book not found in database');
    }

    console.log('\n✅ Book cover update completed successfully!');
    console.log('📝 Summary:');
    console.log('   - Patriot: Updated cover, ISBN, and page count');
    console.log('   - Louise Glück: Updated title, cover, ISBN, and page count');

  } catch (error) {
    console.error('❌ Error updating book covers:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateBookCovers()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

