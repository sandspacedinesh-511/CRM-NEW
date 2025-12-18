const { CountryApplicationProcess } = require('../models');

// Get all country application processes
exports.getAllCountryProcesses = async (req, res) => {
  try {
    const processes = await CountryApplicationProcess.findAll({
      where: { isActive: true },
      order: [['country', 'ASC']]
    });

    res.json({
      success: true,
      data: processes
    });
  } catch (error) {
    console.error('Error fetching country processes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load country processes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get country process by country name
exports.getCountryProcessByCountry = async (req, res) => {
  try {
    const { country } = req.params;
    
    const process = await CountryApplicationProcess.findOne({
      where: { 
        country: country,
        isActive: true 
      }
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Country process not found'
      });
    }

    res.json({
      success: true,
      data: process
    });
  } catch (error) {
    console.error('Error fetching country process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load country process',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get country process by country code
exports.getCountryProcessByCode = async (req, res) => {
  try {
    const { countryCode } = req.params;
    
    const process = await CountryApplicationProcess.findOne({
      where: { 
        countryCode: countryCode.toUpperCase(),
        isActive: true 
      }
    });

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Country process not found'
      });
    }

    res.json({
      success: true,
      data: process
    });
  } catch (error) {
    console.error('Error fetching country process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load country process',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new country process (Admin only)
exports.createCountryProcess = async (req, res) => {
  try {
    const processData = req.body;
    
    // Validate required fields
    const requiredFields = ['country', 'countryCode', 'applicationProcess', 'requiredDocuments'];
    for (const field of requiredFields) {
      if (!processData[field]) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`
        });
      }
    }

    const process = await CountryApplicationProcess.create(processData);

    res.status(201).json({
      success: true,
      message: 'Country process created successfully',
      data: process
    });
  } catch (error) {
    console.error('Error creating country process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create country process',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update country process (Admin only)
exports.updateCountryProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const process = await CountryApplicationProcess.findByPk(id);
    
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Country process not found'
      });
    }

    await process.update(updateData);

    res.json({
      success: true,
      message: 'Country process updated successfully',
      data: process
    });
  } catch (error) {
    console.error('Error updating country process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update country process',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete country process (Admin only)
exports.deleteCountryProcess = async (req, res) => {
  try {
    const { id } = req.params;

    const process = await CountryApplicationProcess.findByPk(id);
    
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Country process not found'
      });
    }

    await process.destroy();

    res.json({
      success: true,
      message: 'Country process deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting country process:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete country process',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get countries list
exports.getCountriesList = async (req, res) => {
  try {
    const countries = await CountryApplicationProcess.findAll({
      where: { isActive: true },
      attributes: ['id', 'country', 'countryCode'],
      order: [['country', 'ASC']]
    });

    res.json({
      success: true,
      data: countries
    });
  } catch (error) {
    console.error('Error fetching countries list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load countries list',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
