import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { performance } from 'perf_hooks';

const BASE_URL = 'http://localhost:3001/api/ai';

async function runLoadTest(concurrency) {
    console.log(`--- STARTING LOAD TEST WITH ${concurrency} CONCURRENT REQUESTS ---\\n`);
    
    const requests = [];
    
    // Prepare dummy files
    if (!fs.existsSync('dummy.jpg')) {
        fs.writeFileSync('dummy.jpg', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
    }

    const startMemory = process.memoryUsage().rss / 1024 / 1024;
    const startTime = performance.now();

    for (let i = 0; i < concurrency; i++) {
        const type = i % 3; // 0: Resume, 1: Background, 2: Blog Title
        
        let reqPromise;
        if (type === 0) {
            const form = new FormData();
            form.append('pdf', fs.createReadStream('./test_resume.pdf'));
            reqPromise = axios.post(`${BASE_URL}/review-resume`, form, { headers: form.getHeaders(), validateStatus: () => true });
        } else if (type === 1) {
            const form = new FormData();
            form.append('image', fs.createReadStream('./dummy.jpg'));
            reqPromise = axios.post(`${BASE_URL}/remove-background`, form, { headers: form.getHeaders(), validateStatus: () => true });
        } else {
            reqPromise = axios.post(`${BASE_URL}/generate-blog-title`, { prompt: `AI Topic Identical` }, { validateStatus: () => true });
        }
        
        requests.push(reqPromise.then(res => ({ type, status: res.status, success: res.data?.success })));
    }

    const results = await Promise.all(requests);
    
    const endTime = performance.now();
    const endMemory = process.memoryUsage().rss / 1024 / 1024;

    const failures = results.filter(r => !r.success || r.status !== 200).length;
    
    console.log(`Total Time: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log(`Memory Used (Approx Diff): ${(endMemory - startMemory).toFixed(2)} MB`);
    console.log(`Total Requests: ${concurrency}`);
    console.log(`Successful: ${concurrency - failures}`);
    console.log(`Failed: ${failures}`);

    if (failures > 0) {
        console.log('\\nSample Failure:', results.filter(r => !r.success || r.status !== 200));
    }
}

runLoadTest(15);
