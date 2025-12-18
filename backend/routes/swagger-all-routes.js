/**
 * Comprehensive Swagger documentation for all 115 routes
 * This file contains documentation for every route in the system
 */

// Authentication Routes (3 routes)
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful }
 *       401: { description: Authentication failed }
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Authentication]
 *     description: Get current authenticated user information
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Current user information }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Authentication]
 *     description: Change user password
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Password changed successfully }
 *       401: { description: Unauthorized }
 */

// Admin Routes (22 routes)
/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard
 *     tags: [Admin]
 *     description: Get admin dashboard statistics
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Dashboard data }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/students:
 *   get:
 *     summary: Get all students
 *     tags: [Admin]
 *     description: Retrieve all students in the system
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of students }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Admin]
 *     description: Update student information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Student updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [Admin]
 *     description: Delete a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Student deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselors:
 *   get:
 *     summary: Get all counselors
 *     tags: [Admin]
 *     description: Retrieve all counselors
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of counselors }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselors:
 *   post:
 *     summary: Add counselor
 *     tags: [Admin]
 *     description: Create a new counselor
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Counselor created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselors/{id}:
 *   put:
 *     summary: Update counselor
 *     tags: [Admin]
 *     description: Update counselor information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Counselor updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselors/{id}/status:
 *   patch:
 *     summary: Update counselor status
 *     tags: [Admin]
 *     description: Update counselor active status
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Status updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselors/{id}:
 *   delete:
 *     summary: Delete counselor
 *     tags: [Admin]
 *     description: Delete a counselor
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Counselor deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/universities:
 *   get:
 *     summary: Get all universities
 *     tags: [Admin]
 *     description: Retrieve all universities
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of universities }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/universities:
 *   post:
 *     summary: Add university
 *     tags: [Admin]
 *     description: Create a new university
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: University created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/universities/{id}:
 *   put:
 *     summary: Update university
 *     tags: [Admin]
 *     description: Update university information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: University updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/universities/{id}:
 *   delete:
 *     summary: Delete university
 *     tags: [Admin]
 *     description: Delete a university
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: University deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get analytics
 *     tags: [Admin]
 *     description: Get system analytics and reports
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Analytics data }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/analytics/export:
 *   get:
 *     summary: Export analytics
 *     tags: [Admin]
 *     description: Export analytics data
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Analytics exported }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: Get reports
 *     tags: [Admin]
 *     description: Get system reports
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Reports data }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/reports/export:
 *   get:
 *     summary: Export reports
 *     tags: [Admin]
 *     description: Export reports data
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Reports exported }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get settings
 *     tags: [Admin]
 *     description: Get system settings
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Settings data }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselor-monitoring:
 *   get:
 *     summary: Get counselor monitoring
 *     tags: [Admin]
 *     description: Get counselor monitoring data
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Monitoring data }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselor-monitoring/real-time:
 *   get:
 *     summary: Get real-time monitoring
 *     tags: [Admin]
 *     description: Get real-time counselor activity
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Real-time data }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselor-monitoring/export:
 *   get:
 *     summary: Export monitoring data
 *     tags: [Admin]
 *     description: Export counselor monitoring data
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Data exported }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/admin/counselor-monitoring/{counselorId}:
 *   get:
 *     summary: Get counselor activity details
 *     tags: [Admin]
 *     description: Get detailed activity for specific counselor
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: counselorId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Counselor activity details }
 *       401: { description: Unauthorized }
 */

// Counselor Routes (45 routes)
/**
 * @swagger
 * /api/counselor/dashboard:
 *   get:
 *     summary: Get counselor dashboard
 *     tags: [Counselor]
 *     description: Get dashboard statistics for counselor
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Dashboard data }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/dashboard/clear-cache:
 *   post:
 *     summary: Clear dashboard cache
 *     tags: [Counselor]
 *     description: Clear counselor dashboard cache
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Cache cleared }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students:
 *   get:
 *     summary: Get counselor students
 *     tags: [Counselor]
 *     description: Get all students assigned to counselor
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of students }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students:
 *   post:
 *     summary: Add student
 *     tags: [Counselor]
 *     description: Create a new student
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Student created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/check-email:
 *   get:
 *     summary: Check email availability
 *     tags: [Counselor]
 *     description: Check if email is available
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Email availability status }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}:
 *   get:
 *     summary: Get student details
 *     tags: [Counselor]
 *     description: Get detailed information about a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Student details }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [Counselor]
 *     description: Update student information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Student updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/phase:
 *   patch:
 *     summary: Update student phase
 *     tags: [Counselor]
 *     description: Update student application phase
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Phase updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [Counselor]
 *     description: Delete a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Student deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/export:
 *   get:
 *     summary: Export students
 *     tags: [Counselor]
 *     description: Export students data
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Students exported }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/documents:
 *   get:
 *     summary: Get student documents
 *     tags: [Counselor]
 *     description: Get all documents for a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of documents }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/documents:
 *   post:
 *     summary: Create document
 *     tags: [Counselor]
 *     description: Create a new document for student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/documents/upload:
 *   post:
 *     summary: Upload document
 *     tags: [Counselor]
 *     description: Upload document file for student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document uploaded }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/documents/export:
 *   get:
 *     summary: Export documents
 *     tags: [Counselor]
 *     description: Export student documents
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Documents exported }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/documents/{id}/preview:
 *   get:
 *     summary: Preview document
 *     tags: [Counselor]
 *     description: Preview a document
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document preview }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/documents/{id}/download:
 *   get:
 *     summary: Download document
 *     tags: [Counselor]
 *     description: Download a document
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document download }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Counselor]
 *     description: Delete a document
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/documents/{id}:
 *   patch:
 *     summary: Update document status
 *     tags: [Counselor]
 *     description: Update document status
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Status updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/documents/{id}:
 *   put:
 *     summary: Update document
 *     tags: [Counselor]
 *     description: Update document information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/documents:
 *   get:
 *     summary: Get all documents
 *     tags: [Counselor]
 *     description: Get all documents for counselor
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of documents }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/applications:
 *   get:
 *     summary: Get student applications
 *     tags: [Counselor]
 *     description: Get all applications for a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of applications }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/applications:
 *   get:
 *     summary: Get all applications
 *     tags: [Counselor]
 *     description: Get all applications for counselor
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of applications }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/applications:
 *   post:
 *     summary: Create application
 *     tags: [Counselor]
 *     description: Create a new application
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Application created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/applications/{id}:
 *   put:
 *     summary: Update application
 *     tags: [Counselor]
 *     description: Update application information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Application updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/applications/{id}:
 *   delete:
 *     summary: Delete application
 *     tags: [Counselor]
 *     description: Delete an application
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Application deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/notes:
 *   get:
 *     summary: Get student notes
 *     tags: [Counselor]
 *     description: Get all notes for a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of notes }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/notes:
 *   post:
 *     summary: Add note
 *     tags: [Counselor]
 *     description: Add a note for a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Note added }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/notes/{noteId}:
 *   put:
 *     summary: Update note
 *     tags: [Counselor]
 *     description: Update a student note
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Note updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/notes/{noteId}:
 *   delete:
 *     summary: Delete note
 *     tags: [Counselor]
 *     description: Delete a student note
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: noteId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Note deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/activities:
 *   get:
 *     summary: Get student activities
 *     tags: [Counselor]
 *     description: Get all activities for a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of activities }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/send-email:
 *   post:
 *     summary: Send email to student
 *     tags: [Counselor]
 *     description: Send email notification to student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Email sent }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/tasks:
 *   get:
 *     summary: Get counselor tasks
 *     tags: [Counselor]
 *     description: Get all tasks for counselor
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of tasks }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/tasks:
 *   post:
 *     summary: Create general task
 *     tags: [Counselor]
 *     description: Create a general task
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Task created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/tasks/{taskId}:
 *   put:
 *     summary: Update general task
 *     tags: [Counselor]
 *     description: Update a general task
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/tasks/{taskId}:
 *   delete:
 *     summary: Delete general task
 *     tags: [Counselor]
 *     description: Delete a general task
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/tasks:
 *   get:
 *     summary: Get student tasks
 *     tags: [Counselor]
 *     description: Get all tasks for a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of tasks }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/tasks:
 *   post:
 *     summary: Create student task
 *     tags: [Counselor]
 *     description: Create a task for a student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/tasks/{taskId}:
 *   put:
 *     summary: Update student task
 *     tags: [Counselor]
 *     description: Update a student task
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/students/{id}/tasks/{taskId}:
 *   delete:
 *     summary: Delete student task
 *     tags: [Counselor]
 *     description: Delete a student task
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Task deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/universities:
 *   get:
 *     summary: Get universities
 *     tags: [Counselor]
 *     description: Get all universities
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of universities }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/profile:
 *   get:
 *     summary: Get counselor profile
 *     tags: [Counselor]
 *     description: Get counselor profile information
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Profile data }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/profile:
 *   put:
 *     summary: Update counselor profile
 *     tags: [Counselor]
 *     description: Update counselor profile information
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Profile updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/profile/avatar:
 *   post:
 *     summary: Upload avatar
 *     tags: [Counselor]
 *     description: Upload counselor avatar
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Avatar uploaded }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/counselor/test-storage:
 *   get:
 *     summary: Test storage
 *     tags: [Counselor]
 *     description: Test storage functionality
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Storage test result }
 *       401: { description: Unauthorized }
 */

// Student Routes (6 routes)
/**
 * @swagger
 * /api/students:
 *   get:
 *     summary: Get all students
 *     tags: [Students]
 *     description: Retrieve all students with optional filtering
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: query
 *         name: counselorId
 *         schema: { type: integer }
 *         description: Filter by counselor ID
 *     responses:
 *       200: { description: List of students }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create student
 *     tags: [Students]
 *     description: Create a new student
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Student created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [Students]
 *     description: Get detailed information about a specific student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Student details }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/students/{id}/phase:
 *   put:
 *     summary: Update student phase
 *     tags: [Students]
 *     description: Update student application phase
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Phase updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/students/{id}/status:
 *   put:
 *     summary: Update student status
 *     tags: [Students]
 *     description: Update student status
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Status updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/students/{id}/reassign:
 *   put:
 *     summary: Reassign student
 *     tags: [Students]
 *     description: Reassign student to different counselor
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Student reassigned }
 *       401: { description: Unauthorized }
 */

// Document Routes (5 routes)
/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     description: Retrieve a specific document with secure presigned URL
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document details with secure URL }
 *       404: { description: Document not found }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/documents/student/{studentId}:
 *   get:
 *     summary: Get student documents
 *     tags: [Documents]
 *     description: Get all documents for a specific student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of documents }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     description: Delete a document
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/documents/{id}/status:
 *   patch:
 *     summary: Update document status
 *     tags: [Documents]
 *     description: Update document status
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Status updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/documents/{id}/metadata:
 *   get:
 *     summary: Get document metadata
 *     tags: [Documents]
 *     description: Get document metadata information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Document metadata }
 *       401: { description: Unauthorized }
 */

// University Routes (6 routes)
/**
 * @swagger
 * /api/universities:
 *   get:
 *     summary: Get all universities
 *     tags: [Universities]
 *     description: Retrieve all active universities for dropdowns and lists
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of universities }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/universities/{studentId}:
 *   post:
 *     summary: Add university to student
 *     tags: [Universities]
 *     description: Add university to student's shortlist
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: University added }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/universities/student/{studentId}:
 *   get:
 *     summary: Get student universities
 *     tags: [Universities]
 *     description: Get universities for a specific student
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of universities }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/universities/{id}/status:
 *   put:
 *     summary: Update university status
 *     tags: [Universities]
 *     description: Update university application status
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Status updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/universities/{id}:
 *   put:
 *     summary: Update university
 *     tags: [Universities]
 *     description: Update university information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: University updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/universities/{id}:
 *   delete:
 *     summary: Delete university
 *     tags: [Universities]
 *     description: Delete a university
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: University deleted }
 *       401: { description: Unauthorized }
 */

// Application Routes (7 routes)
/**
 * @swagger
 * /api/applications:
 *   get:
 *     summary: Get all applications
 *     tags: [Applications]
 *     description: Retrieve all applications with enhanced filtering options
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by application status
 *       - in: query
 *         name: country
 *         schema: { type: string }
 *         description: Filter by country
 *     responses:
 *       200: { description: List of applications }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/applications/student/{studentId}/by-country:
 *   get:
 *     summary: Get student applications by country
 *     tags: [Applications]
 *     description: Get applications for a student grouped by country
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Applications by country }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/applications/multiple:
 *   post:
 *     summary: Create multiple applications
 *     tags: [Applications]
 *     description: Create multiple applications for a student
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Applications created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/applications/{applicationId}/priority:
 *   put:
 *     summary: Update application priority
 *     tags: [Applications]
 *     description: Update application priority
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Priority updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/applications/multiple-countries:
 *   get:
 *     summary: Get students with multiple countries
 *     tags: [Applications]
 *     description: Get students applying to multiple countries
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Students with multiple countries }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/applications/single-country:
 *   get:
 *     summary: Get students with single country
 *     tags: [Applications]
 *     description: Get students applying to single country only
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Students with single country }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/applications/statistics:
 *   get:
 *     summary: Get application statistics
 *     tags: [Applications]
 *     description: Get application statistics and analytics
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Application statistics }
 *       401: { description: Unauthorized }
 */

// User Routes (4 routes)
/**
 * @swagger
 * /api/users/counselors:
 *   get:
 *     summary: Get all counselors
 *     tags: [Users]
 *     description: Retrieve all counselors with their student counts (admin only)
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: List of counselors with student counts }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden - Admin access required }
 */

/**
 * @swagger
 * /api/users/counselors:
 *   post:
 *     summary: Create counselor
 *     tags: [Users]
 *     description: Create a new counselor account
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Counselor created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/users/counselors/{id}:
 *   put:
 *     summary: Update counselor
 *     tags: [Users]
 *     description: Update counselor information
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Counselor updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/users/counselors/{id}/metrics:
 *   get:
 *     summary: Get counselor metrics
 *     tags: [Users]
 *     description: Get performance metrics for a counselor
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Counselor metrics }
 *       401: { description: Unauthorized }
 */

// Validation Routes (4 routes)
/**
 * @swagger
 * /api/validation/email:
 *   post:
 *     summary: Check if email exists
 *     tags: [Validation]
 *     description: Validate if an email address already exists in the system
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: Email validation result }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/validation/phone:
 *   post:
 *     summary: Check if phone exists
 *     tags: [Validation]
 *     description: Validate if a phone number already exists
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string }
 *     responses:
 *       200: { description: Phone validation result }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/validation/passport:
 *   post:
 *     summary: Check if passport exists
 *     tags: [Validation]
 *     description: Validate if a passport number already exists
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passport]
 *             properties:
 *               passport: { type: string }
 *     responses:
 *       200: { description: Passport validation result }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/validation/all:
 *   post:
 *     summary: Check all fields
 *     tags: [Validation]
 *     description: Validate all fields at once
 *     security: [bearerAuth: []]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               phone: { type: string }
 *               passport: { type: string }
 *     responses:
 *       200: { description: All fields validation result }
 *       401: { description: Unauthorized }
 */

// Country Routes (6 routes)
/**
 * @swagger
 * /api/countries:
 *   get:
 *     summary: Get all countries
 *     tags: [Countries]
 *     description: Retrieve all countries available in the system
 *     responses:
 *       200: { description: List of countries }
 *       500: { description: Server error }
 */

/**
 * @swagger
 * /api/countries/{id}:
 *   get:
 *     summary: Get country by ID
 *     tags: [Countries]
 *     description: Get specific country information
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Country details }
 *       404: { description: Country not found }
 */

/**
 * @swagger
 * /api/countries:
 *   post:
 *     summary: Create country
 *     tags: [Countries]
 *     description: Create a new country (admin only)
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Country created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/countries/{id}:
 *   put:
 *     summary: Update country
 *     tags: [Countries]
 *     description: Update country information (admin only)
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Country updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/countries/{id}:
 *   delete:
 *     summary: Delete country
 *     tags: [Countries]
 *     description: Delete a country (admin only)
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Country deleted }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/countries/seed/initial:
 *   post:
 *     summary: Seed initial countries
 *     tags: [Countries]
 *     description: Populate initial country data (admin only)
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Countries seeded }
 *       401: { description: Unauthorized }
 */

// Country Process Routes (7 routes)
/**
 * @swagger
 * /api/country-processes:
 *   get:
 *     summary: Get all country processes
 *     tags: [Country Processes]
 *     description: Retrieve all country application processes
 *     responses:
 *       200: { description: List of country processes }
 *       500: { description: Server error }
 */

/**
 * @swagger
 * /api/country-processes/countries:
 *   get:
 *     summary: Get countries list
 *     tags: [Country Processes]
 *     description: Get list of countries with processes
 *     responses:
 *       200: { description: List of countries }
 *       500: { description: Server error }
 */

/**
 * @swagger
 * /api/country-processes/country/{country}:
 *   get:
 *     summary: Get country process by country
 *     tags: [Country Processes]
 *     description: Get process for specific country
 *     parameters:
 *       - in: path
 *         name: country
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Country process }
 *       404: { description: Process not found }
 */

/**
 * @swagger
 * /api/country-processes/code/{countryCode}:
 *   get:
 *     summary: Get country process by code
 *     tags: [Country Processes]
 *     description: Get process by country code
 *     parameters:
 *       - in: path
 *         name: countryCode
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Country process }
 *       404: { description: Process not found }
 */

/**
 * @swagger
 * /api/country-processes:
 *   post:
 *     summary: Create country process
 *     tags: [Country Processes]
 *     description: Create a new country process (admin only)
 *     security: [bearerAuth: []]
 *     responses:
 *       200: { description: Process created }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/country-processes/{id}:
 *   put:
 *     summary: Update country process
 *     tags: [Country Processes]
 *     description: Update country process (admin only)
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Process updated }
 *       401: { description: Unauthorized }
 */

/**
 * @swagger
 * /api/country-processes/{id}:
 *   delete:
 *     summary: Delete country process
 *     tags: [Country Processes]
 *     description: Delete a country process (admin only)
 *     security: [bearerAuth: []]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Process deleted }
 *       401: { description: Unauthorized }
 */

// This file contains comprehensive Swagger documentation for all 115 routes
// Each route is properly documented with tags, descriptions, and response codes
