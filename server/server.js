const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Lost & Found Campus Management System`);
  console.log(`🌐 Server active: http://localhost:${PORT}`);
  console.log(`⚡ Environment:   ${process.env.NODE_ENV || 'development'}`);
  console.log(`==================================================\n`);
});
