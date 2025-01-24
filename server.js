const express = require('express');const path = require('path');

const app = express();
const port = process.env.PORT || 8080;
app.use(express.static(path.join(__dirname, "dist/")))

app.listen(port);
console.log('Server started at https://localhost:' + port);

module.exports = app;


