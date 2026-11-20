import type { RoleCode } from '../generated/prisma/client.js';

export type AuthContext = { userId: string; institutionId: string; displayName: string; roles: RoleCode[] };

declare global {
  namespace Express { interface Request { auth?: AuthContext } }
}

export {};
