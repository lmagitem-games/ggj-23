const express = require("express");
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const createError = require("http-errors");
const expressSession = require("express-session");
const MemoryStore = require("memorystore")(expressSession);
const http = require("http");

// Environment variables
global.prod = process.env.args === "prod";
require("dotenv").config({ path: prod ? "./.env" : "./.env.local" });

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: false,
    })
);

// Session configuration
const session = {
    secret: process.env.SESSION_SECRET,
    cookie: { maxAge: 86400000 },
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
    }),
};
if (prod) {
    // Serve secure cookies, requires HTTPS
    session.cookie.secure = true;
    // Trust Nginx
    app.set("trust proxy", 1);
}

app.use(expressSession(session));
app.use("/", express.static(path.join(__dirname, "./public")));
app.use("*", express.static(path.join(__dirname, "./public")));

// Find 404 and hand over to error handler
app.use((_req, _res, next) => next(createError(404)));

// error handler
app.use((err, _req, res, _next) => {
    console.error(err.message); // Log error message in our server's console
    if (!err.statusCode) err.statusCode = 500; // If err has no specified error code, set error code to 'Internal Server Error (500)'
    res.status(err.statusCode).send(err.message); // All HTTP requests must have a response, so let's send back an error with its status code and message
});

http.createServer(app)
    .listen(8036, () => console.log("INFO", "Server started on port 8036"));