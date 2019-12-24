import express from 'express';
import authMiddleware from './../middlewares/authMiddleware'
import userController from './../controllers/userController'
import schemaValidator from "./../middlewares/validations/schemaValidator"
import fileUploadMiddleware from './../middlewares/fileUploadMiddleware'
import customValidations from './../middlewares/customValidationsMiddleware'
const validateRequest = schemaValidator(true)

const router = express.Router();

router.post('/sign-in', [
  validateRequest
], userController.signin);

// Fetch User Profile
router.get('/profile',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken
  ],
  userController.profile
)

router.patch('/profile',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    validateRequest
  ],
  userController.updateProfile
)

router.get('/users', [
  authMiddleware.checkAuthHeader,
  authMiddleware.validateAccessToken
],
  userController.listAllUsers
)

// Update Password
router.post('/password/update',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    validateRequest,
    customValidations.checkCurrentPassword
  ],
  userController.updatePassword
)

router.post('/password/forgot',
  [
    validateRequest,
    authMiddleware.isUserExistByPhone
  ],
  userController.forgotPassword)

router.post('/password/reset', [
  validateRequest,
  authMiddleware.isUserExistByPhone
],
  userController.resetPassword)

router.post('/phone/update', [
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    validateRequest,
    customValidations.checkPhoneNumberExist
  ],
  userController.updatePhone
])

router.post('/phone/reset', [
  authMiddleware.checkAuthHeader,
  authMiddleware.validateAccessToken,
  validateRequest,
  customValidations.checkPhoneNumberExist
],
  userController.resetPhone)

router.post('/profile-pic',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    fileUploadMiddleware.saveUserProfilePic,
  ],
  userController.updateUserProfilePic)

export default router
