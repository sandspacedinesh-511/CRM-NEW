const Setting = require('../models/Setting');

// GET /admin/settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await Setting.findAll();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = s.value;
    });
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
};

// PUT /admin/settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    for (const key of Object.keys(updates)) {
      const [setting, created] = await Setting.findOrCreate({
        where: { key },
        defaults: { value: updates[key] }
      });
      if (!created) {
        await setting.update({ value: updates[key] });
      }
    }
    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, message: 'Error updating settings' });
  }
}; 