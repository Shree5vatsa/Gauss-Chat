import { asyncHandler } from "../middlewares/asyncHandler.middleware";
import { registerSchema } from "../validators/auth.validator";

export const registerController = asyncHandler(
    async (req: Request, res: Response) => {
        const body = registerSchema.parse(req.body);
        
        
    }

)