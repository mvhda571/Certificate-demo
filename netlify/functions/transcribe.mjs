// Netlify Functions v2: /api/transcribe — ovozni Whisper bilan matnga aylantiradi.
import { handleTranscribeRequest } from '../../server/tutor/transcribe.mjs';

export default async (req) => handleTranscribeRequest(req);

export const config = { path: '/api/transcribe' };
