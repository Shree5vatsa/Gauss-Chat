import { UserDocument } from "../models/user.model";

export {};

declare global {
  namespace Express {
    interface User extends UserDocument {
      _id?: any;
    }
  }
}
