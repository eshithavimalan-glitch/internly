
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Resume = require('../models/Resume');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/* ---------- AUTH MIDDLEWARE ---------- */
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'No token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

/* ---------- MULTER SETUP ---------- */
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext === '.pdf' || ext === '.docx') cb(null, true);
  else cb(new Error('Only PDF or DOCX allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

/* ---------- TEXT EXTRACTION ---------- */
async function extractText(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  if (ext === '.pdf') {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  }

  if (ext === '.docx') {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  }

  return '';
}

/* ---------- ANALYSIS ---------- */
function analyzeResumeText(text) {
  const lower = (text || '').toLowerCase();

  const skills = {
    coding:   ['javascript', 'python', 'java', 'react', 'node', 'c++', 'coding', 'developer', 'programming'],
    design:   ['ui', 'ux', 'design', 'figma', 'photoshop', 'illustrator'],
    logic:    ['algorithm', 'problem solving', 'data structures', 'logic', 'math'],
    strategy: ['management', 'planning', 'strategy', 'leadership', 'business'],
    teamwork: ['team', 'collaboration', 'communication', 'agile', 'scrum'],
  };

  const scores = {};
  for (const skill in skills) {
    let score = 0;
    for (const keyword of skills[skill]) {
      if (lower.includes(keyword)) score += 12;
    }
    scores[skill] = Math.min(score, 100);
  }

  const overallScore = Math.round(
    Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
  );

  return { overallScore, skillsMatch: scores };
}

/* ---------- UPLOAD ENDPOINT ---------- */
router.post('/upload', authenticate, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const extractedText = await extractText(req.file.path, req.file.originalname);
    const analysis = analyzeResumeText(extractedText);

    const resume = new Resume({
      userId: req.userId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      extractedText,
      analysisResults: {
        overallScore: analysis.overallScore,
        skillsMatch: analysis.skillsMatch,
        progressPercentage: analysis.overallScore,
        suggestions: [],
        detectedSkills: [],
      },
    });

    await resume.save();

    res.status(201).json({
      success: true,
      message: 'Resume uploaded & analyzed successfully',
      data: {
        resumeId: resume._id,
        filename: resume.originalName,
        analysis: {
          overallScore: analysis.overallScore,
          skillsMatch: analysis.skillsMatch,
        },
      },
    });
  } catch (error) {
    console.error('Upload error:', error);

    try {
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    } catch {}

    if (error.message?.includes('Only PDF or DOCX')) {
      return res.status(400).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

module.exports = router;