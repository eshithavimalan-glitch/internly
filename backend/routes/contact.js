
const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Contact = require('../models/Contact');

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// @route   POST /api/contact
// @desc    Submit contact form
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Get user's IP and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Save to database
    const contact = new Contact({
      name,
      email,
      subject,
      message,
      ipAddress,
      userAgent
    });

    await contact.save();

    // Send email notification (if configured)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        const transporter = createTransporter();

        // Email to admin
        const adminMailOptions = {
          from: `"INTERNLY Contact Form" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: `New Contact Form: ${subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">New Contact Form Submission</h2>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Subject:</strong> ${subject}</p>
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>
              <p style="color: #64748b; font-size: 12px;">
                Submitted at: ${new Date().toLocaleString()}<br>
                IP: ${ipAddress}
              </p>
            </div>
          `
        };

        // Auto-reply to user
        const userMailOptions = {
          from: `"INTERNLY Team" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'We received your message!',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Thank you for contacting INTERNLY!</h2>
              <p>Hi ${name},</p>
              <p>We've received your message and will get back to you as soon as possible.</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Your message:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
              </div>

              <p>If you have any urgent questions, feel free to reach out directly.</p>
              
              <p style="margin-top: 30px;">
                Best regards,<br>
                <strong>The INTERNLY Team</strong>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #64748b; font-size: 12px;">
                This is an automated response. Please do not reply to this email.
              </p>
            </div>
          `
        };

        // Send both emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);

      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
      data: {
        contactId: contact._id,
        submittedAt: contact.createdAt
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
});

// @route   GET /api/contact
// @desc    Get all contact messages (Admin only - add auth later)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, page = 1 } = req.query;

    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Contact.countDocuments(query);

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contacts'
    });
  }
});

// @route   PATCH /api/contact/:id/status
// @desc    Update contact status
// @access  Private (Admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    if (!['new', 'read', 'responded', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: { contact }
    });

  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact'
    });
  }
});

module.exports = router;
