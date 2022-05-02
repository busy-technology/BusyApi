module.exports = {
  ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3000',
  URL: process.env.BASE_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI,
  EXPIRY_TIME: process.env.EXPIRY_TIME || '60',
  JWT_SECRET: process.env.JWT_SECRET || 'BUSY SOLUIONS ARE ALWAYS PROTECTED',
  ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET,
  ENCRYPTION_IV: process.env.IV,
  BUGSNAG_SECRET: '4f9c6f5c48e8a3148c0dc06309ef7072',
};
