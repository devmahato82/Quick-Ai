import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const BASE_URL = 'http://localhost:3001/api/ai';

async function runTests() {
    console.log('--- STARTING REAL HTTP TESTS ---\\n');

    // TEST 1: Resume Review (Valid PDF)
    try {
        console.log('Testing Resume Review...');
        const form = new FormData();
        form.append('pdf', fs.createReadStream('./test_resume.pdf'));
        const res = await axios.post(`${BASE_URL}/review-resume`, form, { headers: form.getHeaders() });
        console.log('Resume Review Output:', res.data);
    } catch (e) {
        console.error('Resume Review Error:', e.response?.data || e.message);
    }

    // TEST 2: Background Removal (Valid Image)
    // Create a dummy image
    fs.writeFileSync('dummy.jpg', Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'));
    try {
        console.log('\\nTesting Background Removal...');
        const form = new FormData();
        form.append('image', fs.createReadStream('./dummy.jpg'));
        const res = await axios.post(`${BASE_URL}/remove-background`, form, { headers: form.getHeaders() });
        console.log('Background Removal Output:', res.data);
    } catch (e) {
        console.error('Background Removal Error:', e.response?.data || e.message);
    }

    // TEST 3: Image Generation (Fallback test via OPENAI mocking or billing failure)
    try {
        console.log('\\nTesting Image Generation (Catch fallback)...');
        const res = await axios.post(`${BASE_URL}/generate-image`, { prompt: 'A cool blue dog' });
        console.log('Image Gen Output:', res.data);
    } catch (e) {
        console.error('Image Gen Error:', e.response?.data || e.message);
    }

    // TEST 4: Blog Title Generator
    try {
        console.log('\\nTesting Blog Title Generator...');
        const res = await axios.post(`${BASE_URL}/generate-blog-title`, { prompt: 'AI in healthcare' });
        console.log('Blog Title Output:', res.data);
    } catch (e) {
        console.error('Blog Title Error:', e.response?.data || e.message);
    }

    // TEST 5: Failure Testing - Invalid File for Resume
    try {
        console.log('\\nTesting Invalid File Upload for Resume...');
        const form = new FormData();
        form.append('pdf', fs.createReadStream('./dummy.jpg'), { contentType: 'image/jpeg' });
        const res = await axios.post(`${BASE_URL}/review-resume`, form, { headers: form.getHeaders(), validateStatus: () => true });
        console.log('Invalid File Upload Output:', res.data);
    } catch (e) {
        console.error('Invalid File Upload Error:', e.message);
    }
}

runTests();
