const express = require('express');
const connectDB = require('./config/db')

const app = express();

// Connect to DB
connectDB();

// init middleware
// replaces body-parcer
app.use(express.json({extended: false}));

const PORT = process.env.PORT || 5000;

// Define the routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

app.get('/', (req, res) => res.send('API running!'))

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));