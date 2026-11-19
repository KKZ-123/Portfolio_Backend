import jwt, { SignOptions } from 'jsonwebtoken';

const getJwtSecret = (): string => process.env.JWT_SECRET || 'default_jwt_secret_key';
const getJwtRefreshSecret = (): string => process.env.JWT_REFRESH_SECRET || 'default_jwt_refresh_secret_key';
const getJwtExpiresIn = (): SignOptions['expiresIn'] => (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'];
const getJwtRefreshExpiresIn = (): SignOptions['expiresIn'] => (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'];

export interface TokenPayload {
  userid: string;
  email: string;
  role: string;
  [key: string]: unknown;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export function generateTokens(payload: TokenPayload): AuthTokens {
  const access_token = jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  });

  const refresh_token = jwt.sign(payload, getJwtRefreshSecret(), {
    expiresIn: getJwtRefreshExpiresIn(),
  });

  return {
    access_token,
    refresh_token,
  };
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: getJwtExpiresIn(),
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtRefreshSecret()) as TokenPayload;
}
