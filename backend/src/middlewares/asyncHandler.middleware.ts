import { Request, Response,NextFunction } from "express";


//if an async route handler throws an error, Express does NOT catch it automatically.
//so we need to wrap it in a try-catch block and pass the error to the next middleware

type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<any> //the function is asynchronous...any because of throwing an error

export const asyncHandler = (controller: AsyncController) => 
    async (req: Request, res: Response, next: NextFunction) => { //express passes at call time
        try {
            await controller(req, res, next);
        } catch (error) {
            next(error);
        }
    }



