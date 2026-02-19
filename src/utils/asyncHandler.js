//  ye ek method baanayaga aur use export kerdega 
//  wrapper function
const asyncHandler = (fn) => async(req, res, next) => {
    try {
        await fn(req, res, next);
    }
    catch (err) {
        res.status(err.code || 500).json({
            success : false,
            message : err.message || "Internal Server Error"
        })                                     
    }
}
                     
export default asyncHandler;

//  ye method ek function lega as an argument aur usko execute karega aur agar koi error aata hai to usko catch karega aur next middleware ko pass karega.


                  