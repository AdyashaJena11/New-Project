// backend/server.js
const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const cors = require('cors');
const fs = require('fs');
const pdfParse = require('pdf-parse');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        const fileBuffer = fs.readFileSync(req.file.path);
        const data = await pdfParse(fileBuffer);
        const resumeText = data.text;
        
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ role: 'user', content: `Analyze this resume and provide improvements: ${resumeText}` }],
            max_tokens: 500,
        });

        res.json({ analysis: response.choices[0].message.content });
        fs.unlinkSync(req.file.path);
    } catch (error) {
        res.status(500).json({ error: 'Error processing resume' });
    }
});

app.listen(5000, () => console.log('Server running on port 5000'));

// frontend/src/App.js
import React, { useState } from 'react';
import axios from 'axios';

function App() {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState('');

    const handleUpload = async () => {
        const formData = new FormData();
        formData.append('resume', file);
        const response = await axios.post('http://localhost:5000/analyze', formData);
        setAnalysis(response.data.analysis);
    };

    return (
        <div className="p-6 max-w-lg mx-auto text-center">
            <h1 className="text-2xl font-bold">AI Resume Analyzer</h1>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mt-4" />
            <button onClick={handleUpload} className="bg-blue-500 text-white p-2 mt-2 rounded">Analyze Resume</button>
            <div className="mt-4 p-4 bg-gray-100 rounded">{analysis}</div>
        </div>
    );
}

export default App;

// frontend/src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);

// Deployment Steps
// 1. Deploy frontend on Vercel: `vercel`
// 2. Deploy backend on Render/Fly.io: `node server.js` after setting up env variables
