

export const errorMiddleware = (err, req, res,next) => {
    err.message ||= 'internal server error'
    err.statusCode ||= 500;

    if(err.code === 11000){
        const error = Object.keys(err.keyPattern).join(', ');
        err.message = `Dublicate field - ${error}`;
        err.statusCode = 400;
    }

    if(err.name === 'CastError'){
        const errorPath = err.path;
        err.message = `invalid format: ${errorPath}`;
        err.statusCode = 400;
    }

    return res.status(err.statusCode).json({
        success: false,
        message: err.message,
        errorType: err
    })
}