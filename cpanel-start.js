const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Set environment variables to limit resource usage
process.env.UV_THREADPOOL_SIZE = '1';  // Limit libuv thread pool size
process.env.NODE_OPTIONS = '--max-old-space-size=256'; // Limit memory usage

// Force production mode
process.env.NODE_ENV = 'production';

const app = next({ dev: false });
const handle = app.getRequestHandler();
const port = process.env.PORT || 3000;

// Increase the timeout for preparing the Next.js app
const prepareTimeout = setTimeout(() => {
  console.error('Next.js app preparation timed out');
  process.exit(1);
}, 60000); // 60 seconds timeout

app.prepare()
  .then(() => {
    clearTimeout(prepareTimeout);
    
    const server = createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Request error:', err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Add error handling for the server
    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    server.listen(port, (err) => {
      if (err) {
        console.error('Failed to start server:', err);
        return;
      }
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    clearTimeout(prepareTimeout);
    console.error('Failed to prepare Next.js app:', err);
    process.exit(1);
  }); 