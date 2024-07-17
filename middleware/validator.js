import { body, check, validationResult } from "express-validator"
import { errorHandler } from "../utils/handleError.js";


export const registerValidator = ()=>[
    body("name","Please enter name").notEmpty(),
    body("username","Please enter username").notEmpty(),
    body("password","Please enter password").notEmpty(),
];
export const loginValidator = ()=>[
    body("username","Please enter username").notEmpty(),
    body("password","Please enter password").notEmpty(),
];

export const validateHandler = (req,res,next) =>{
    const errors = validationResult(req);

    const errorMassage = errors.array().map(i=> i.msg).join(', ');
    console.log(errors);

    if(errors.isEmpty()) return next();
    else return next(new errorHandler(errorMassage,400))
}