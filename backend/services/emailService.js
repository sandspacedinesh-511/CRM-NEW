const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  async initializeTransporter() {
    if (this.initialized) return;

    try {
      // Check if SMTP configuration is available
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('SMTP configuration not found. Email service will be disabled.');
        this.initialized = true;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error('Email service configuration error:', error);
        } else {
          logger.info('Email service is ready to send messages');
        }
      });
      
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      this.initialized = true; // Mark as initialized to prevent retries
    }
  }

  async sendEmail(to, subject, html, text = null) {
    // Initialize transporter if not already done
    if (!this.initialized) {
      await this.initializeTransporter();
    }

    if (!this.transporter) {
      logger.error('Email transporter not available. Check SMTP configuration.');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || this.stripHtml(html),
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return false;
    }
  }

  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // Welcome email for new users
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Counselor CRM!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Welcome to Counselor CRM!</h2>
        <p>Hello ${user.name},</p>
        <p>Welcome to your new Counselor CRM account. We're excited to help you manage your students and applications more efficiently.</p>
        <p>Here's what you can do with your account:</p>
        <ul>
          <li>Manage student profiles and applications</li>
          <li>Track application progress and deadlines</li>
          <li>Upload and organize documents</li>
          <li>Generate reports and analytics</li>
        </ul>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The Counselor CRM Team</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your Counselor CRM account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0;">
          Reset Password
        </a>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The Counselor CRM Team</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }

  // Application status update notification
  async sendApplicationStatusUpdate(student, application, status) {
    const subject = `Application Status Update - ${status}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Application Status Update</h2>
        <p>Hello ${student.name},</p>
        <p>Your application to <strong>${application.universityName}</strong> has been updated.</p>
        <p><strong>New Status:</strong> ${status}</p>
        <p><strong>Program:</strong> ${application.program}</p>
        <p><strong>Updated Date:</strong> ${new Date().toLocaleDateString()}</p>
        <p>Please log into your Counselor CRM account to view more details.</p>
        <p>Best regards,<br>The Counselor CRM Team</p>
      </div>
    `;

    return this.sendEmail(student.email, subject, html);
  }

  // Document upload notification
  async sendDocumentUploadNotification(student, document) {
    const subject = 'New Document Uploaded';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">New Document Uploaded</h2>
        <p>Hello ${student.name},</p>
        <p>A new document has been uploaded to your profile:</p>
        <p><strong>Document Name:</strong> ${document.name}</p>
        <p><strong>Document Type:</strong> ${document.type}</p>
        <p><strong>Upload Date:</strong> ${new Date(document.createdAt).toLocaleDateString()}</p>
        <p>Please log into your Counselor CRM account to review the document.</p>
        <p>Best regards,<br>The Counselor CRM Team</p>
      </div>
    `;

    return this.sendEmail(student.email, subject, html);
  }

  // Deadline reminder
  async sendDeadlineReminder(student, deadline) {
    const subject = 'Upcoming Deadline Reminder';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff9800;">Upcoming Deadline Reminder</h2>
        <p>Hello ${student.name},</p>
        <p>This is a reminder about an upcoming deadline:</p>
        <p><strong>Deadline:</strong> ${deadline.title}</p>
        <p><strong>Due Date:</strong> ${new Date(deadline.dueDate).toLocaleDateString()}</p>
        <p><strong>Description:</strong> ${deadline.description}</p>
        <p>Please make sure to complete this task before the deadline.</p>
        <p>Best regards,<br>The Counselor CRM Team</p>
      </div>
    `;

    return this.sendEmail(student.email, subject, html);
  }

  // Task assignment notification
  async sendTaskAssignmentNotification(user, task) {
    const subject = 'New Task Assigned';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1976d2;">New Task Assigned</h2>
        <p>Hello ${user.name},</p>
        <p>A new task has been assigned to you:</p>
        <p><strong>Task:</strong> ${task.title}</p>
        <p><strong>Description:</strong> ${task.description}</p>
        <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p>Please log into your Counselor CRM account to view and complete this task.</p>
        <p>Best regards,<br>The Counselor CRM Team</p>
      </div>
    `;

    return this.sendEmail(user.email, subject, html);
  }
}

module.exports = new EmailService(); 