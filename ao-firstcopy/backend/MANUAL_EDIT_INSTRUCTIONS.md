# Manual Edit Instructions for models/index.js

Please manually add these 3 changes to `backend/models/index.js`:

## 1. Add import after line 14 (after `const Notification = require('./Notification');`):
```javascript
const SharedLead = require('./SharedLead');
```

## 2. Add associations after line 106 (after the Notification associations):
```javascript
// SharedLead associations
User.hasMany(SharedLead, { foreignKey: 'senderId', as: 'sentSharedLeads' });
User.hasMany(SharedLead, { foreignKey: 'receiverId', as: 'receivedSharedLeads' });
SharedLead.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
SharedLead.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });
SharedLead.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(SharedLead, { foreignKey: 'studentId', as: 'sharedLeads' });
```

## 3. Add to exports (around line 125, add `SharedLead` to the module.exports object):
```javascript
module.exports = {
  User,
  Student,
  University,
  Document,
  Note,
  Activity,
  CounselorActivity,
  StudentUniversityApplication,
  ApplicationCountry,
  CountryApplicationProcess,
  Task,
  Country: CountryModel,
  TelecallerImportedTask,
  Notification,
  SharedLead  // <-- ADD THIS LINE
};
```

After making these edits, save the file and the backend should restart automatically.
