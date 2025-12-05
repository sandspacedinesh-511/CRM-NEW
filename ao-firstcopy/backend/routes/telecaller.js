const express = require('express');
const router = express.Router();
const { auth, checkRole } = require('../middlewares/auth');
const telecallerController = require('../controllers/telecallerController');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
    }
  }
});

router.use(auth, checkRole(['telecaller']));

router.get('/dashboard', telecallerController.getDashboard);
router.get('/tasks', telecallerController.getTasks);
router.get('/tasks/export', telecallerController.exportTasks);
router.patch('/tasks/:id/complete', telecallerController.completeTask);
router.patch('/tasks/:id/reschedule', telecallerController.rescheduleTask);
router.post('/tasks/import', upload.single('file'), telecallerController.importTasksFromExcel);
router.get('/tasks/imported', telecallerController.getImportedTasks);
router.patch('/tasks/imported/:id', telecallerController.updateImportedTask);
router.post('/calls/start', telecallerController.logCallInitiated);

module.exports = router;

