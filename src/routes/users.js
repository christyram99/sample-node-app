import express from 'express'
import authMiddleware from './../middlewares/authMiddleware'
import {
  signIn,
  profile,
  updateProfile,
  listAllUsers,
  updatePassword,
  forgotPassword,
  resetPassword,
  updatePhone,
  resetPhone,
  updateUserProfilePic,
} from './../controllers/userController'
import schemaValidator from './../middlewares/validations/schemaValidator'
import fileUploadMiddleware from './../middlewares/fileUploadMiddleware'
import customValidations from './../middlewares/customValidationsMiddleware'
const validateRequest = schemaValidator(true)

const router = express.Router()

router.post('/sign-in',
  [
    validateRequest
  ],
  signIn
)

router.get('/profile',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken
  ],
  profile,
)

router.patch('/profile',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    validateRequest
  ],
  updateProfile,
)

router.get('/users', [
  authMiddleware.checkAuthHeader,
  authMiddleware.validateAccessToken
],
listAllUsers,
)

router.post('/password/update',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    validateRequest,
    customValidations.checkCurrentPassword
  ],
  updatePassword,
)

router.post('/password/forgot',
  [
    validateRequest,
    authMiddleware.isUserExistByPhone
  ],
  forgotPassword,
)

router.post('/password/reset',
  [
    validateRequest,
    authMiddleware.isUserExistByPhone
  ],
  resetPassword,
)

router.post('/phone/update',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    validateRequest,
    customValidations.checkPhoneNumberExist
  ],
  updatePhone,
)

router.post('/phone/reset',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    validateRequest,
    customValidations.checkPhoneNumberExist
  ],
  resetPhone,
)

router.post('/profile-pic',
  [
    authMiddleware.checkAuthHeader,
    authMiddleware.validateAccessToken,
    fileUploadMiddleware.saveUserProfilePic,
  ],
  updateUserProfilePic,
)

export default router
