import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Script to fix any books with empty or whitespace-only titles/authors
 * This ensures all books have valid, non-empty titles and authors
 */
async function fixEmptyTitles() {
  console.log('🔍 Checking for books with empty or invalid titles/authors...');

  try {
    // Find all books
    const allBooks = await prisma.book.findMany();
    
    let fixedCount = 0;
    let deletedCount = 0;

    for (const book of allBooks) {
      const hasEmptyTitle = !book.title || book.title.trim().length === 0;
      const hasEmptyAuthor = !book.author || book.author.trim().length === 0;

      if (hasEmptyTitle || hasEmptyAuthor) {
        console.log(`\n❌ Found book with issue:`);
        console.log(`   ID: ${book.id}`);
        console.log(`   Title: "${book.title}"`);
        console.log(`   Author: "${book.author}"`);

        // If both title and author are empty, delete the book as it's invalid
        if (hasEmptyTitle && hasEmptyAuthor) {
          console.log(`   Action: Deleting (both title and author are empty)`);
          await prisma.book.delete({ where: { id: book.id } });
          deletedCount++;
        } else {
          // Fix the book by setting placeholder values if needed
          const updates: any = {};
          
          if (hasEmptyTitle) {
            updates.title = book.author ? `Untitled Book by ${book.author.trim()}` : 'Untitled Book';
            console.log(`   Action: Setting title to "${updates.title}"`);
          }
          
          if (hasEmptyAuthor) {
            updates.author = book.title ? book.title.trim() : 'Unknown Author';
            console.log(`   Action: Setting author to "${updates.author}"`);
          }

          await prisma.book.update({
            where: { id: book.id },
            data: updates,
          });
          fixedCount++;
        }
      }
    }

    console.log(`\n✅ Scan complete!`);
    console.log(`   Total books scanned: ${allBooks.length}`);
    console.log(`   Books fixed: ${fixedCount}`);
    console.log(`   Books deleted: ${deletedCount}`);
    console.log(`   Books OK: ${allBooks.length - fixedCount - deletedCount}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixEmptyTitles()
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

