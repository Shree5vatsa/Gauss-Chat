import userModel from "../models/user.model";
import { UnauthorizedException } from "../utils/app-Error";
import { LoginSchemaType, RegisterSchemaType } from "../validators/auth.validator";


export const registerService = async (body: RegisterSchemaType) => {
    const { email } = body;
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
        throw new UnauthorizedException("User already exists");
    }

    const newUser = new userModel({
        name: body.name,
        email: body.email,
        password: body.password,
        avatar: body.avatar,
    });
    await newUser.save();
    return newUser;
}

export const loginService = async (body: LoginSchemaType) => {
    const { email, password } = body;

    const user = await userModel.findOne({ email });

    if (!user) throw new UnauthorizedException("Email or Password not found");
    
    const isPasswordMatched = await user.comparePassword(password);

    if(!isPasswordMatched) throw new UnauthorizedException("Invalid Email or Password");
    return user;
}