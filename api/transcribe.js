import { handleTranscribeRequest } from '../server/tutor/transcribe.mjs';
import { toVercelHandler } from '../server/tutor/vercelAdapter.mjs';

export default toVercelHandler(handleTranscribeRequest, '/api/transcribe');
