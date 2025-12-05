const { Student } = require('../models');

// Check if email exists
exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const existingStudent = await Student.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    res.json({
      success: true,
      exists: !!existingStudent,
      message: existingStudent ? 'Email already exists' : 'Email is available',
      student: existingStudent ? {
        id: existingStudent.id,
        firstName: existingStudent.firstName,
        lastName: existingStudent.lastName,
        email: existingStudent.email
      } : null
    });

  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking email' 
    });
  }
};

// Check if phone number exists
exports.checkPhoneExists = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ 
        success: false, 
        message: 'Phone number is required' 
      });
    }

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    const existingStudent = await Student.findOne({
      where: { phone: normalizedPhone }
    });

    res.json({
      success: true,
      exists: !!existingStudent,
      message: existingStudent ? 'Phone number already exists' : 'Phone number is available',
      student: existingStudent ? {
        id: existingStudent.id,
        firstName: existingStudent.firstName,
        lastName: existingStudent.lastName,
        phone: existingStudent.phone
      } : null
    });

  } catch (error) {
    console.error('Error checking phone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking phone number' 
    });
  }
};

// Check if passport number exists
exports.checkPassportExists = async (req, res) => {
  try {
    const { passportNumber } = req.body;
    
    if (!passportNumber) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passport number is required' 
      });
    }

    const existingStudent = await Student.findOne({
      where: { passportNumber: passportNumber.toUpperCase().trim() }
    });

    res.json({
      success: true,
      exists: !!existingStudent,
      message: existingStudent ? 'Passport number already exists' : 'Passport number is available',
      student: existingStudent ? {
        id: existingStudent.id,
        firstName: existingStudent.firstName,
        lastName: existingStudent.lastName,
        passportNumber: existingStudent.passportNumber
      } : null
    });

  } catch (error) {
    console.error('Error checking passport number:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking passport number' 
    });
  }
};

// Check all fields at once
exports.checkAllFields = async (req, res) => {
  try {
    const { email, phone, passportNumber } = req.body;
    const results = {};

    // Check email
    if (email) {
      const emailStudent = await Student.findOne({
        where: { email: email.toLowerCase().trim() }
      });
      results.email = {
        exists: !!emailStudent,
        student: emailStudent ? {
          id: emailStudent.id,
          firstName: emailStudent.firstName,
          lastName: emailStudent.lastName
        } : null
      };
    }

    // Check phone
    if (phone) {
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');
      const phoneStudent = await Student.findOne({
        where: { phone: normalizedPhone }
      });
      results.phone = {
        exists: !!phoneStudent,
        student: phoneStudent ? {
          id: phoneStudent.id,
          firstName: phoneStudent.firstName,
          lastName: phoneStudent.lastName
        } : null
      };
    }

    // Check passport
    if (passportNumber) {
      const passportStudent = await Student.findOne({
        where: { passportNumber: passportNumber.toUpperCase().trim() }
      });
      results.passportNumber = {
        exists: !!passportStudent,
        student: passportStudent ? {
          id: passportStudent.id,
          firstName: passportStudent.firstName,
          lastName: passportStudent.lastName
        } : null
      };
    }

    res.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('Error checking fields:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error checking fields' 
    });
  }
};
