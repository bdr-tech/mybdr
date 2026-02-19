import * as jose from "jose";

const getSecret = () => new TextEncoder().encode(process.env.JWT_SECRET);

const ALGORITHM = "HS256";
const EXPIRY = "30d";

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp?: number;
  iat?: number;
  jti?: string;
}

export async function generateToken(user: {
  id: bigint;
  email: string;
  nickname: string | null;
  membershipType: number;
}): Promise<string> {
  return new jose.SignJWT({
    sub: user.id.toString(),
    email: user.email,
    name: user.nickname ?? "",
    role: String(user.membershipType),
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function refreshToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  return new jose.SignJWT({
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .setJti(crypto.randomUUID())
    .sign(getSecret());
}
