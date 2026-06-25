export function errorHandler(error , _req, res, _next){
    const statusCode = getStatusCode(error);
    
    if (statusCode >= 500){
        console.error(error);
    }

    const payload ={
        error : error.error || getDefaultErrorTitle(statusCode),
        message : error.message || "An unexpected server error has occured."
    };

    if(error.detials !== undefined){
        payload.detials =  error.detials;
    }

    res.status(statusCode).json(payload);
}

function getStatusCode(error){
    if(Number.isInteger(error.statusCode)){
        return error.statusCode;
    }
    if(Number.isInteger(error.status)){
        return error.status;
    }
    if(error.type === "entity.parse.failed"){
        return 400;
    }
    return 500;
}

function getDefaultErrorTitle(statusCode){
    if(statusCode === 400) {
        return "Bad Request";
    }
    if(statusCode === 404){
        return "Not Found";
    }
    return "Internal Server Error"
}