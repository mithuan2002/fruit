// Vercel serverless function that redirects to static build
export default function handler(req, res) {
  // Check if this is a static file request
  if (req.url.includes('.')) {
    // For static files, serve from the build directory
    return res.redirect(301, req.url);
  }
  
  // For all other requests, serve the main app
  res.setHeader('content-type', 'text/html');
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="0; url=/index.html">
      <title>Fruitbox - Redirecting...</title>
    </head>
    <body>
      <p>Redirecting to Fruitbox...</p>
    </body>
    </html>
  `);
}