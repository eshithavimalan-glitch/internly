const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    extractedText: {
      type: String,
      default: ''
    },
    analysisResults: {
      overallScore: { type: Number, default: 0 },
      skillsMatch: {
        coding:   { type: Number, default: 0 },
        design:   { type: Number, default: 0 },
        logic:    { type: Number, default: 0 },
        strategy: { type: Number, default: 0 },
        teamwork: { type: Number, default: 0 }
      },
      progressPercentage: { type: Number, default: 0 },
      suggestions:    { type: [String], default: [] },
      detectedSkills: { type: [String], default: [] }
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Resume || mongoose.model('Resume', resumeSchema);