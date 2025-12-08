import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { recommendationsRouter } from './routes/recommendations.js';
import { booksRouter } from './routes/books.js';
import { shelvesRouter } from './routes/shelves.js';
import { readingGoalRouter } from './routes/reading-goal.js';
import { profileRouter } from './routes/profile.js';
import { articlesRouter } from './routes/articles.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/books', booksRouter);
app.use('/api/shelves', shelvesRouter);
app.use('/api/reading-goal', readingGoalRouter);
app.use('/api/profile', profileRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/articles', articlesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 Ipshita's Library API ready!`);
});
