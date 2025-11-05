import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import tripsRouter from './routes/trips';

// Load environment variables
dotenv.config();

// Create Express application
const app: Application = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/api/trips', tripsRouter);

// Export app for testing
export { app };
