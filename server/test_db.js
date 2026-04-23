import 'dotenv/config';
import sql from './configs/db.js';

(async () => {
  try {
    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES ('test_user_123', 'Resume Review', 'Summary', 'resume')`;
    console.log('Insert Success');
  } catch(e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();
