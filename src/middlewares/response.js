export function withMessage(message, status){
    return (_res,res,next) => {
        res.locals.message = message;

        if(status !== undefined){
            res.locals.status = status;
        }

        next();
    };
}

export function sendResponse(_req,res){
    const status = res.locals.status || 200;

    if(status === 204) {
        res.status(204).send();
        return;
    }

    res.status(status).json({
        message: res.locals.message | "Success", data : res.locals.data ?? null
    });

}