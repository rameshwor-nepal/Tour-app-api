const express = require("express");
const morgan = require("morgan")

const tourRouter = require("./routes/tourRoutes")
const userRouter = require("./routes/userRoutes")
const reviewRouter = require("./routes/reviewRoutes")

const AppError = require("./utils/appError")
const globalErrorHandler = require("./controllers/errorControllers")
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')

const app = express();

app.use(helmet())
// middleware
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

//limit the rate of request
// const limiter = rateLimit({
//     max: 50,
//     windowMs: 60 * 60 * 1000,
//     message: "Too many request from this IP, please try again in an hour!"
// })

// app.use("/api", limiter);

//bpdy parser, reading data from body into req.body
app.use(express.json());
app.use(mongoSanitize());
app.use(xss())

app.use(express.static(`${__dirname}/public`));

//route
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter)

app.all('*', (req, res, next) => {
    // const err = new Error(`Cannot find ${req.originalUrl} on this server!`);
    // err.status = 'fail';
    // err.statusCode = 404;

    next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
})

app.use(globalErrorHandler);

// console.log(process.env.NODE_ENV, "env")

module.exports = app;

