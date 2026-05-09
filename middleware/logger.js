const crypto = require('crypto');

function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    let userIdentifier = 'anonymous';
    
    // If the request is authenticated, hash the user ID for anonymity in logs
    if (req.user && req.user.id) {
      userIdentifier = crypto.createHash('sha256').update(req.user.id).digest('hex').substring(0, 8);
    }
    
    console.log(`[${new Date().toISOString()}] | User: ${userIdentifier} | Method: ${req.method} | Path: ${req.originalUrl} | Status: ${res.statusCode} | Time: ${duration}ms`);
  });
  
  next();
}

module.exports = requestLogger;
