import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`ChronosPay backend server running on port ${PORT}`);
});
