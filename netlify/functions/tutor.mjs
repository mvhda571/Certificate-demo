// Netlify Functions v2: /api/tutor — umumiy server handler'ini chaqiradi.
import { handleTutorRequest } from '../../server/tutor/handler.mjs';

export default async (req) => handleTutorRequest(req);

export const config = { path: '/api/tutor' };
