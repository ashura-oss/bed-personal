import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { setupSwagger } from './_extras/api-docs/swagger.js';
import { errorHandler } from './src/utils/_errors.js';
import userRoutes from './src/routes/userRoutes.js';
import characterRoutes from './src/routes/characterRoutes.js';
import regionRoutes from './src/routes/regionRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('src/frontend'));

const healthCheck = (req, res) => res.json({ status: 'ok' });

app.get('/health', healthCheck);
app.get('/api/health', healthCheck);

app.use('/api/users', userRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/regions', regionRoutes);

await setupSwagger(app);

app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      status: 404,
    },
  });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`API docs at http://localhost:${PORT}/api-docs`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Try a different port by setting the PORT environment variable.`);
      process.exit(1);
    }

    throw err;
  });
}

export default app;
