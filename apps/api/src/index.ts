import 'dotenv/config';
import { app } from './app.js';
import { connectDB } from './db/index.js';

const PORT = process.env['PORT'] ?? 3001;

// Connect to MongoDB and start server
void (async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`[api] Server running on http://localhost:${PORT.toString()}`);
  });
})();
