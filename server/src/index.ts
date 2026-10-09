import { app } from './app';
import { PORT, MODE } from './config';

app.listen(PORT, () => {
  console.log(`[Preflight Server] Running on http://localhost:${PORT} in ${MODE} mode`);
});
