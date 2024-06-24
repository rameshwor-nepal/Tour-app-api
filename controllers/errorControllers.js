const AppError = require("../utils/appError");

const handleCastErrorDb = (err) => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 404);
}

const handleDuplicateDb = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value ${value}, Please use another value`
    return new AppError(message, 404);
}

const handleValidationErrorDb = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input value. ${errors.join(". ")}`
    return new AppError(message, 404);
}

const handleJWTWebToken = () => new AppError("Invalid Token!, Please login again", 401)

const handleTokenExpire = () => new AppError("Token Expired!, Please login again", 401)

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
}

const sendErrorProduction = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    else {
        console.error("Error", err)
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong!'
        });
    }

}
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res)
    }
    else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        if (error.name === 'CastError') error = handleCastErrorDb(error)
        if (error.code === '1100') error = handleDuplicateDb(error)
        if (error.name === 'ValidationError') error = handleValidationErrorDb(error)

        if (error.name === 'JsonWebTokenError') error = handleJWTWebToken()
        if (error.name === 'TokenExpiredError') error = handleTokenExpire()

        sendErrorProduction(error, res)
    }
    else {
        console.log("Error occurred")
    }
    // next();
};