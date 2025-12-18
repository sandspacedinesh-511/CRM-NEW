const { Country } = require('../models');

// Get all active countries
exports.getAllCountries = async (req, res) => {
  try {    const countries = await Country.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'code', 'region', 'isActive']
    });    res.status(200).json({
      success: true,
      message: 'Countries fetched successfully',
      data: countries,
      total: countries.length
    });
  } catch (error) {
    console.error('[ERROR] Error fetching countries:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching countries',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get country by ID
exports.getCountryById = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await Country.findByPk(id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    res.status(200).json({
      success: true,
      data: country
    });
  } catch (error) {
    console.error('[ERROR] Error fetching country:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching country',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create new country (admin only)
exports.createCountry = async (req, res) => {
  try {
    const { name, code, region } = req.body;

    // Validation
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required'
      });
    }

    // Check if country already exists
    const existingCountry = await Country.findOne({
      where: { code }
    });

    if (existingCountry) {
      return res.status(400).json({
        success: false,
        message: `Country with code '${code}' already exists`
      });
    }

    const country = await Country.create({
      name,
      code: code.toUpperCase(),
      region,
      isActive: true
    });    res.status(201).json({
      success: true,
      message: 'Country created successfully',
      data: country
    });
  } catch (error) {
    console.error('[ERROR] Error creating country:', error.message);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Country already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating country',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update country (admin only)
exports.updateCountry = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, region, isActive } = req.body;

    const country = await Country.findByPk(id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    await country.update({
      name: name || country.name,
      code: code ? code.toUpperCase() : country.code,
      region: region !== undefined ? region : country.region,
      isActive: isActive !== undefined ? isActive : country.isActive
    });    res.status(200).json({
      success: true,
      message: 'Country updated successfully',
      data: country
    });
  } catch (error) {
    console.error('[ERROR] Error updating country:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating country',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete country (admin only)
exports.deleteCountry = async (req, res) => {
  try {
    const { id } = req.params;

    const country = await Country.findByPk(id);

    if (!country) {
      return res.status(404).json({
        success: false,
        message: 'Country not found'
      });
    }

    const countryName = country.name;
    await country.destroy();    res.status(200).json({
      success: true,
      message: 'Country deleted successfully',
      data: { id, name: countryName }
    });
  } catch (error) {
    console.error('[ERROR] Error deleting country:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting country',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Seed initial countries (for initialization)
exports.seedCountries = async (req, res) => {
  try {    const initialCountries = [
      { name: 'United States', code: 'US', region: 'North America' },
      { name: 'United Kingdom', code: 'UK', region: 'Europe' },
      { name: 'Canada', code: 'CA', region: 'North America' },
      { name: 'Australia', code: 'AU', region: 'Oceania' },
      { name: 'New Zealand', code: 'NZ', region: 'Oceania' },
      { name: 'Ireland', code: 'IE', region: 'Europe' },
      { name: 'Germany', code: 'DE', region: 'Europe' },
      { name: 'France', code: 'FR', region: 'Europe' },
      { name: 'Netherlands', code: 'NL', region: 'Europe' },
      { name: 'Japan', code: 'JP', region: 'Asia' },
      { name: 'Singapore', code: 'SG', region: 'Asia' },
      { name: 'India', code: 'IN', region: 'Asia' },
      { name: 'UAE', code: 'AE', region: 'Middle East' },
      { name: 'China', code: 'CN', region: 'Asia' },
      { name: 'South Korea', code: 'KR', region: 'Asia' },
      { name: 'Other', code: 'OT', region: 'Other' }
    ];

    // Check how many countries exist
    const existingCount = await Country.count();
    
    if (existingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Countries already seeded (${existingCount} countries exist)`
      });
    }

    const createdCountries = await Country.bulkCreate(initialCountries);    res.status(201).json({
      success: true,
      message: `${createdCountries.length} countries seeded successfully`,
      data: createdCountries
    });
  } catch (error) {
    console.error('[ERROR] Error seeding countries:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error seeding countries',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
