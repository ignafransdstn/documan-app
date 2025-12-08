import { Plugin } from 'vite';

export default function disableHostCheck(): Plugin {
  return {
    name: 'disable-host-check',
    configureServer(server) {
      // Override the checkOrigin middleware to always return true
      const originalCheckOrigin = server.middlewares.stack.find(
        (middleware) => middleware.handle.name === 'viteHMRPingMiddleware'
      );
      
      // Add custom middleware at the beginning to bypass host check
      server.middlewares.use((req, res, next) => {
        // Remove host header check by accepting all hosts
        if (req.headers.host) {
          req.headers.host = 'localhost:5173';
        }
        next();
      });
    },
  };
}
