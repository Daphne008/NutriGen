import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../config/env";

type JwtPayload = {
  sub: number;
  role: Role;
};

export const signToken = (userId: number, role: Role): string => {
  return jwt.sign({ sub: userId, role }, env.jwtSecret, {
    expiresIn: "7d"
  });
};

export const verifyToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;

  if (!decoded.sub || !decoded.role) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: Number(decoded.sub),
    role: decoded.role as Role
  };
};
