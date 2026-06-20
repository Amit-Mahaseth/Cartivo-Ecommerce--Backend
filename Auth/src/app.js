const express = require('express');
const AuthRoutes = require('./routes/auth.route');
const cookieParser = require('cookie-parser');
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', AuthRoutes);
module.exports = app;
