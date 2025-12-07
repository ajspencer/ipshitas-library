import { Book, Shelf, ReadingGoal } from '../types/book';

/**
 * Initial book data pre-populated with Ipshita's reading list
 * Each book includes her authentic reviews and ratings from her website
 */
export const initialBooks: Book[] = [
  {
    id: '1',
    title: 'The Fountainhead',
    author: 'Ayn Rand',
    reviews: [
      {
        id: 'r1-1',
        content: "One of my all-time favorites. The quote that stays with me: 'Self-sacrifice? But it is precisely the self that cannot and must not be sacrificed.' A powerful exploration of individualism and creative integrity.",
        rating: 5,
        dateAdded: '2020-01-15',
      }
    ],
    tags: ['Philosophy', 'Classic', 'Individualism'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780452273337-L.jpg',
    dateAdded: '2020-01-15',
    status: 'read',
    totalPages: 753,
    progress: 753,
    isbn: '9780452273337',
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    reviews: [
      {
        id: 'r2-1',
        content: "My favourite quotes: 'if both the past and the external world exist only in the mind, and if the mind itself is controllable – what then?' and 'Freedom is the freedom to say that two plus two make four. If that is granted, all else follows.' A book I revisit often.",
        rating: 5,
        dateAdded: '2020-06-20',
      }
    ],
    tags: ['Dystopia', 'Classic', 'Political Fiction'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg',
    dateAdded: '2020-06-20',
    status: 'read',
    totalPages: 328,
    progress: 328,
    isbn: '9780451524935',
  },
  {
    id: '3',
    title: 'Crime and Punishment',
    author: 'Fyodor Dostoevsky',
    reviews: [
      {
        id: 'r3-1',
        content: "Incredibly moving – I am still thinking about it. Crime & Punishment made me think deeply about our standards of morality and punishment. One of the most profound explorations of guilt and redemption I've ever read.",
        rating: 5,
        dateAdded: '2024-11-15',
      }
    ],
    tags: ['Russian Literature', 'Philosophy', 'Classic'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780143058144-L.jpg',
    dateAdded: '2024-11-15',
    status: 'read',
    totalPages: 671,
    progress: 671,
    isbn: '9780143058144',
  },
  {
    id: '4',
    title: 'Just Kids',
    author: 'Patti Smith',
    reviews: [
      {
        id: 'r4-1',
        content: "Incredibly moving – I am still thinking about it. A beautiful memoir about art, friendship, and the bohemian life in New York. Patti Smith's writing is pure poetry.",
        rating: 5,
        dateAdded: '2024-10-20',
      }
    ],
    tags: ['Memoir', 'Music', 'Art'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780060936228-L.jpg',
    dateAdded: '2024-10-20',
    status: 'read',
    totalPages: 304,
    progress: 304,
    isbn: '9780060936228',
  },
  {
    id: '5',
    title: 'The Brothers Karamazov',
    author: 'Fyodor Dostoevsky',
    reviews: [
      {
        id: 'r5-1',
        content: "A masterpiece of Russian literature exploring faith, doubt, free will, and morality. The Grand Inquisitor chapter alone is worth reading the entire book for.",
        rating: 5,
        dateAdded: '2023-08-10',
      }
    ],
    tags: ['Russian Literature', 'Philosophy', 'Classic'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374528379-L.jpg',
    dateAdded: '2023-08-10',
    status: 'read',
    totalPages: 796,
    progress: 796,
    isbn: '9780374528379',
  },
  {
    id: '6',
    title: 'Trust',
    author: 'Hernan Diaz',
    reviews: [
      {
        id: 'r6-1',
        content: "A brilliant exploration of wealth, power, and the stories we tell about both. The nested narrative structure is masterfully executed.",
        rating: 5,
        dateAdded: '2023-05-15',
      }
    ],
    tags: ['Literary Fiction', 'Historical Fiction'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593420317-L.jpg',
    dateAdded: '2023-05-15',
    status: 'read',
    totalPages: 416,
    progress: 416,
    isbn: '9780593420317',
  },
  {
    id: '7',
    title: 'The Body Keeps the Score',
    author: 'Bessel van der Kolk',
    reviews: [
      {
        id: 'r7-1',
        content: "A groundbreaking look at how trauma reshapes both body and brain. Essential reading for understanding the mind-body connection and healing.",
        rating: 5,
        dateAdded: '2022-09-20',
      }
    ],
    tags: ['Psychology', 'Non-Fiction', 'Science'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780143127741-L.jpg',
    dateAdded: '2022-09-20',
    status: 'read',
    totalPages: 464,
    progress: 464,
    isbn: '9780143127741',
  },
  {
    id: '8',
    title: 'The Three-Body Problem',
    author: 'Cixin Liu',
    reviews: [
      {
        id: 'r8-1',
        content: "Was one of my first scientific fiction books, and I got through it slowly, but surely – it's mind-opening. Set against the backdrop of China's cultural revolution makes it even more compelling.",
        rating: 5,
        dateAdded: '2020-08-15',
      }
    ],
    tags: ['SciFi', 'Mind Bending', 'Chinese Literature'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780765382030-L.jpg',
    dateAdded: '2020-08-15',
    status: 'read',
    totalPages: 400,
    progress: 400,
    isbn: '9780765382030',
  },
  {
    id: '9',
    title: 'The Dark Forest',
    author: 'Cixin Liu',
    reviews: [
      {
        id: 'r9-1',
        content: "I could NOT put this down. The characters, the plot, the overarching understanding of the universe—this book has it all. I was awed by the scientific concepts. I definitely learnt more here than in all my physics classes combined. A solid 5/5.",
        rating: 5,
        dateAdded: '2024-02-20',
      }
    ],
    tags: ['SciFi', 'Mind Bending'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780765377081-L.jpg',
    dateAdded: '2024-02-20',
    status: 'read',
    totalPages: 512,
    progress: 512,
    isbn: '9780765377081',
  },
  {
    id: '10',
    title: "Death's End",
    author: 'Cixin Liu',
    reviews: [
      {
        id: 'r10-1',
        content: "An epic conclusion to the trilogy. The scale of imagination is breathtaking – from the death lines to the pocket universes. Liu Cixin's vision of the cosmos is both terrifying and beautiful.",
        rating: 5,
        dateAdded: '2021-03-10',
      }
    ],
    tags: ['SciFi', 'Mind Bending'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780765386632-L.jpg',
    dateAdded: '2021-03-10',
    status: 'read',
    totalPages: 604,
    progress: 604,
    isbn: '9780765386632',
  },
  {
    id: '11',
    title: 'The Kite Runner',
    author: 'Khaled Hosseini',
    reviews: [
      {
        id: 'r11-1',
        content: "A powerful story about guilt, redemption, and the bonds of friendship set against the backdrop of Afghanistan's tumultuous history. Beautifully written and deeply moving.",
        rating: 5,
        dateAdded: '2019-06-15',
      }
    ],
    tags: ['Literary Fiction', 'Historical Fiction', 'Afghanistan'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781594631931-L.jpg',
    dateAdded: '2019-06-15',
    status: 'read',
    totalPages: 371,
    progress: 371,
    isbn: '9781594631931',
  },
  {
    id: '12',
    title: 'All the Light We Cannot See',
    author: 'Anthony Doerr',
    reviews: [
      {
        id: 'r12-1',
        content: "Exquisitely crafted prose that weaves together the stories of a blind French girl and a German boy during WWII. The writing is luminous and the structure is masterful.",
        rating: 5,
        dateAdded: '2020-04-10',
      }
    ],
    tags: ['Historical Fiction', 'WWII', 'Literary Fiction'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781501173219-L.jpg',
    dateAdded: '2020-04-10',
    status: 'read',
    totalPages: 531,
    progress: 531,
    isbn: '9781501173219',
  },
  {
    id: '13',
    title: 'Born a Crime',
    author: 'Trevor Noah',
    reviews: [
      {
        id: 'r13-1',
        content: "Lives up to all the hype and then some. It's difficult to write about racism without victimization and pity, and Trevor did exactly that. His mother is an extraordinary figure, and the way he tells their story is both hilarious and heartbreaking. Recommended very, very highly.",
        rating: 5,
        dateAdded: '2020-12-18',
      }
    ],
    tags: ['Memoir', 'Humor', 'South Africa'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780399588174-L.jpg',
    dateAdded: '2020-12-18',
    status: 'read',
    totalPages: 304,
    progress: 304,
    isbn: '9780399588174',
  },
  {
    id: '14',
    title: 'Patriot',
    author: 'Alexei Navalny',
    reviews: [
      {
        id: 'r14-1',
        content: "Alexei Navalny is a hero the world perhaps didn't deserve. I remember watching the documentary in 2021 by finding an unofficial link through Telegram. This memoir is a testament to courage and conviction in the face of authoritarian oppression.",
        rating: 5,
        dateAdded: '2024-12-01',
      }
    ],
    tags: ['Memoir', 'Politics', 'Russia'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593802649-L.jpg',
    dateAdded: '2024-12-01',
    status: 'read',
    totalPages: 480,
    progress: 480,
    isbn: '9780593802649',
  },
  {
    id: '15',
    title: 'A Little Life',
    author: 'Hanya Yanagihara',
    reviews: [
      {
        id: 'r15-1',
        content: "720 pages!! The internet is deeply divided on this one—everyone on Reddit hates it, but if you love it, they hate you. I lived a full life reading this while backpacking Southeast Asia. It's devastating, beautiful, and unforgettable.",
        rating: 5,
        dateAdded: '2023-07-22',
      }
    ],
    tags: ['Literary Fiction', 'Long Read', 'Emotional'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780385539258-L.jpg',
    dateAdded: '2023-07-22',
    status: 'read',
    totalPages: 720,
    progress: 720,
    isbn: '9780385539258',
  },
  {
    id: '16',
    title: 'Why Fish Don\'t Exist',
    author: 'Lulu Miller',
    reviews: [
      {
        id: 'r16-1',
        content: "Incredibly moving – I am still thinking about it. A beautiful blend of science, memoir, and philosophy that questions how we categorize the world. It challenged my understanding of order and chaos.",
        rating: 5,
        dateAdded: '2024-11-20',
      }
    ],
    tags: ['Science', 'Memoir', 'Philosophy'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781501160271-L.jpg',
    dateAdded: '2024-11-20',
    status: 'read',
    totalPages: 240,
    progress: 240,
    isbn: '9781501160271',
  },
  {
    id: '17',
    title: 'Things in Nature Merely Grow',
    author: 'Louise Glück',
    reviews: [
      {
        id: 'r17-1',
        content: "Glück's poetry is spare, precise, and deeply profound. Each poem feels like a meditation on existence, loss, and the natural world.",
        rating: 5,
        dateAdded: '2023-03-15',
      }
    ],
    tags: ['Poetry', 'Literature'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780374612504-L.jpg',
    dateAdded: '2023-03-15',
    status: 'read',
    totalPages: 112,
    progress: 112,
    isbn: '9780374612504',
  },
  {
    id: '18',
    title: 'Pachinko',
    author: 'Min Jin Lee',
    reviews: [
      {
        id: 'r18-1',
        content: "10/10. Life of a family across generations, covering many themes in a non-stereotypical way: the immigrant experience (specifically Korea > Japan), inter-generational mobility, gender, sex, money, and family. I loved how it explored the 'real' East Asia.",
        rating: 5,
        dateAdded: '2023-12-15',
      }
    ],
    tags: ['Historical Fiction', 'Generational', 'Korea'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9781455563920-L.jpg',
    dateAdded: '2023-12-15',
    status: 'read',
    totalPages: 496,
    progress: 496,
    isbn: '9781455563920',
  },
  {
    id: '19',
    title: 'Where the Crawdads Sing',
    author: 'Delia Owens',
    reviews: [
      {
        id: 'r19-1',
        content: "I lapped it up. This book is about family, love, loneliness, and the price we pay to not be lonely. The writing is so vivid I could visualize every word. The protagonist is flawed, and that's what makes the book magnificent.",
        rating: 4,
        dateAdded: '2024-03-10',
      }
    ],
    tags: ['Nature', 'Fiction', 'Mystery'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780735219090-L.jpg',
    dateAdded: '2024-03-10',
    status: 'read',
    totalPages: 368,
    progress: 368,
    isbn: '9780735219090',
  },
  {
    id: '20',
    title: 'The Great Alone',
    author: 'Kristin Hannah',
    reviews: [
      {
        id: 'r20-1',
        content: "Such a rollercoaster of emotions—love, solitude, domestic violence, and the choices that define our lives. The portrayal of the 'real' Alaska is so raw and untamed that I spent hours reading about the state after finishing this. A wholesome read that makes you feel many things.",
        rating: 5,
        dateAdded: '2024-04-05',
      }
    ],
    tags: ['Alaska', 'Emotional', 'Family'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780312577230-L.jpg',
    dateAdded: '2024-04-05',
    status: 'read',
    totalPages: 448,
    progress: 448,
    isbn: '9780312577230',
  },
  {
    id: '21',
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    reviews: [],
    tags: ['SciFi', 'Adventure'],
    coverUrl: 'https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg',
    dateAdded: '2024-08-15',
    status: 'want_to_read',
    totalPages: 496,
    isbn: '9780593135204',
  },
];

/**
 * Profile data for the library owner
 */
export const profileData = {
  name: "Ipshita",
  libraryName: "Ipshita's Library",
  bio: "I measure my life in terms of the impact I create. I care deeply about freedom of speech – a freedom core to the pursuit of truth. Barack Obama and Alexei Navalny are my idols.",
  avatar: "📚", // Emoji avatar for now
};

/**
 * Default shelves that always exist
 */
export const defaultShelves: Shelf[] = [
  { id: 'all', name: 'All Books', createdAt: '2024-01-01' },
  { id: 'want_to_read', name: 'Want to Read', createdAt: '2024-01-01' },
  { id: 'reading', name: 'Currently Reading', createdAt: '2024-01-01' },
  { id: 'read', name: 'Read', createdAt: '2024-01-01' },
];

/**
 * Initial reading goal
 */
export const initialReadingGoal: ReadingGoal = {
  year: 2024,
  target: 24,
  current: 19, // Books marked as "read"
};
