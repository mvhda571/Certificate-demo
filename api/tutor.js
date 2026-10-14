import { handleTutorRequest } from '../server/tutor/handler.mjs';
import { toVercelHandler } from '../server/tutor/vercelAdapter.mjs';

export default toVercelHandler(handleTutorRequest, '/api/tutor');
