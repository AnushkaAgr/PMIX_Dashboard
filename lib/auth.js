import jwt from 'jsonwebtoken';

export function verifyAuth(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export function getUsers() {
  try {
    return JSON.parse(process.env.USERS_JSON || '{}');
  } catch {
    return {};
  }
}
