export function notFound(req, res){
    res.status(404).json({error:"Not Found" , message: `No route found for ${req.method} ${req.originalUrl}`})
}