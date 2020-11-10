import UserDataServiceProvider from '../services/database/userDataServiceProvider'
import config from './../config/app'
import jwt from 'jsonwebtoken'
import utils from '../helpers/utils'
import userDataServiceProvider from '../services/database/userDataServiceProvider'
import md5 from 'md5'

async function signIn (req, res, next) {
  try {
    const { username, password } = req.body

    const user = await UserDataServiceProvider.login(username, password)

    if (!user) {
      const respData = {
        success: false,
        message: 'Invalid credentials',
      }

      return res.status(401).json(respData)
    }

    req.user = user
    
    // Is account verified
    if (!req.user.email_verified) {
      const respData = {
        success: false,
        message: 'Your account is not verified',
      }
      return res.status(403).json(respData)
    }

    const user = {
      id: req.user._id,
      username: req.user.username,
      phone_number: req.user.phone_number,
      user_type: req.user.user_type,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      status: req.user.status,
    }

    const tokenSecret = config.jwt.token_secret + req.user.password
    const refreshTokenSecret = config.jwt.refresh_token_secret + req.user.password

    const token = jwt.sign(user, tokenSecret, {
      expiresIn: config.jwt.token_life
    })

    const refreshToken = jwt.sign(user, refreshTokenSecret, {
      expiresIn: config.jwt.refresh_token_life
    })

    if (req.user.password) {
      delete req.user.password
    }

    const respData = {
      success: true,
      user_details: req.user,
      access_token: token,
      refresh_token: refreshToken,
      message: 'User login success',
    }

    return res.status(201).json(respData)
  } catch (error) {
    next(error)
  }
}

async function signUp (req, res, next) {
  try {
    const payload = req.body

    const user = await UserDataServiceProvider.saveUser(payload)
    delete user.password

    const respData = {
      success: true,
      message: 'User created successfully',
      data: user,
    }
    return res.status(201).json(respData)
  } catch (err) {
    if (err.code && err.code === 11000) {
      err.message = 'Phone number already exists or Email already exists'
      err.statusCode = 422
    }
    next(err)
  }
}

async function profile (req, res, next) {
  try {
    const respData = {
      success: true,
      message: 'User profile data fetched successfully',
      user_details: req.user
    }
    return res.status(200).json(respData)
  } catch (error) {
    next(error)
  }
}

// update profile data
async function updateProfile (req, res, next) {
  try {
    const profileData = req.body
    const updatedUserData = await UserDataServiceProvider.updateUserById(req.user._id, profileData)
    const respData = {
      success: true,
      message: 'Profile Updated successfully',
      profile_details: updatedUserData
    }
    return res.status(200).json(respData)
  } catch (error) {
    next(error)
  }
}

async function updatePassword (req, res, next) {
  try {
    const userId = req.user._id
    const password = req.body.new_password

    await userDataServiceProvider.updateUserPasswordById(userId, password)

    const respData = {
      success: true,
      message: 'Password Updated successfully'
    }
    return res.status(200).json(respData)
  } catch (error) {
    next(error)
  }
}

async function updatePhone (req, res, next) {
  try {
    // we have to send otp to new mobile number

    const OTP = utils.getRandomOTP()

    const otpData = {
      otp: OTP,
      user_id: req.user._id,
      phone_number: req.body.phone_number,
      event: 'UPDATE_PHONE'
    }

    const response = await sendOTPonUpdatePhoneNumber(otpData)

    if (!response.sentStatus) {
      return res.status(422).json({
        success: false,
        message: response.message
      })
    }

    await OtpDataServiceProvider.saveOtp(otpData)

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    })
  } catch (error) {
    next(error)
  }
}

async function resetPhone (req, res, next) {
  try {
    const otpData = req.body
    const userId = req.user._id
    const { verified, message } = await verifyOTPonUpdatePhoneNumber(otpData.phone_number, otpData.otp)

    if (!verified) {
      return res.status(422).json({
        success: false,
        message
      })
    }
    const profileData = {
      phone_number: otpData.phone_number
    }
    await userDataServiceProvider.updateUserById(userId, profileData)

    res.status(200).json({
      success: true,
      message: 'OTP Verified and New Phone Number updated successfully'
    })
  } catch (err) {
    next(err)
  }
}

async function forgotPassword (req, res, next) {
  try {
    const OTP = utils.getRandomOTP()

    const otpData = {
      otp: OTP,
      user_id: req.requested_user_details._id,
      phone_number: req.requested_user_details.phone_number,
      event: 'FORGOT_PASSWORD'
    }

    const response = await sendOTPonforgotPassword(otpData)
    if (!response.sentStatus) {
      return res.status(422).json({
        success: false,
        message: response.message
      })
    }

    await OtpDataServiceProvider.saveOtp(otpData)

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully'
    })
  } catch (err) {
    next(err)
  }
}

async function resetPassword (req, res, next) {
  try {
    const otpData = req.body
    const userId = req.requested_user_details._id
    const { verified, message } = await verifyOTPonforgotPassword(otpData.phone_number, otpData.otp)

    if (!verified) {
      return res.status(422).json({
        success: false,
        message
      })
    }

    const updated = await userDataServiceProvider.updateUserPasswordById(userId, otpData.new_password)

    res.status(200).json({
      success: true,
      message: 'OTP Verified and New password updated successfully'
    })
  } catch (err) {
    next(err)
  }
}

async function updateUserProfilePic (req, res, next) {
  try {
    const file = req.file

    if (!file) {
      return res.status(422).json({
        success: false,
        message: 'File is required'
      })
    }

    let filename = req.user._id + 'avatar_node_app_1.0' + Date.now()
    filename = `${md5(filename)}.${file.mimetype.split('/')[1]}`
    req.profile_pic_path = filename
    const s3Response = await AWSS3ServiceProvider.createFile(filename, req.file.buffer)

    await userDataServiceProvider.updateUserProfilePicById(req.user._id, filename)

    const respData = {
      success: true,
      message: 'User profile pic updated successfully',
      data: {
        user_id: req.user._id,
        avatar: req.profile_pic_path
      }
    }
    return res.status(200).json(respData)
  } catch (error) {
    console.log(error)
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Something went wrong'
    })
  }
}

async function listAllUsers (req, res, next) {
  try {
    const query = req.body
    const { skip, limit } = req.body

    if (skip) {
      delete query.skip
    }

    if (limit) {
      delete query.limit
    }

    const users = await UserDataServiceProvider.getAllUsers(query, skip, limit)

    const respData = {
      success: true,
      message: 'User Details fetched successfully',
      users
    }
    return res.status(200).json(respData)
  } catch (error) {
    next(error)
  }
}

async function updateUser (req, res, next) {
  try {
    const userData = req.body
    const updatedUserData = await UserDataServiceProvider.updateUserById(req.requested_user_details._id, userData)

    const respData = {
      success: true,
      message: `${req.requested_user_details.user_type.capitalize() || 'User'} Data Updated successfully`,
      user_details: updatedUserData
    }
    return res.status(200).json(respData)
  } catch (error) {
    if (err.code && err.code === 11000) {
      err.message = 'Phone number Already Exists !'
      err.statusCode = 422
    }
    next(error)
  }
}

async function deleteUser (req, res, next) {
  try {
    const userData = req.body
    await UserDataServiceProvider.deleteUserById(userData.user_id)
    const respData = {
      success: true,
      message: `${req.requested_user_details.user_type.capitalize() || 'User'} Deleted successfully`
    }
    return res.status(200).json(respData)
  } catch (error) {
    next(error)
  }
}

async function listAllUsersWithFilter (req, res, next) {
  try {
    const { skip, limit, query = {}, sort } = req.parsedFilterParams

    const [count = 0, users = []] = await Promise.all([
      await UserDataServiceProvider.countAllUsers(query),
      await UserDataServiceProvider.getAllUsers(query, skip, limit, sort)
    ])

    const hasMore = count ? (skip + users.length) < count : false
    const totalPages = limit ? Math.ceil(count / limit) : 1

    return res.json({
      success: true,
      message: 'List of Users Fetched Successfully',
      users,
      has_more: hasMore,
      total: count,
      total_pages: totalPages,
      page: req.body.page || 1
    })
  } catch (err) {
    next(err)
  }
}

async function sendOTPonforgotPassword (otpData) {
  // we have to send SMS
  let smsBody = comminicationConstants.sms.forgot_pwd_otp.ENG

  smsBody = smsBody.replace('##OTP##', otpData.otp.toString())
  return smsAPIServiceProvider.sendSMS(otpData.phone_number, smsBody)
}

async function sendOTPonUpdatePhoneNumber (otpData) {
  let smsBody = comminicationConstants.sms.reset_phone_otp.ENG
  smsBody = smsBody.replace('##OTP##', otpData.otp.toString())
  return smsAPIServiceProvider.sendSMS(otpData.phone_number, smsBody)
}

async function verifyOTPonforgotPassword (phoneNumber, otp) {
  const query = {
    created_at: { $gte: new Date().getLastMinutesTime(15) },
    phone_number: phoneNumber,
    event: 'FORGOT_PASSWORD'
  }
  const skip = 0; const limit = 0
  const sort = { _id: -1 }

  const otpList = await OtpDataServiceProvider.getAllOtps(query, skip, limit, sort)

  const matchedIndex = otpList.findIndex(obj => obj.otp === otp)

  if (matchedIndex > -1) {
    return {
      verified: true,
      message: 'OTP verified with phone number'
    }
  }

  return {
    verified: false,
    message: 'Incorrect OTP'
  }
}

async function verifyOTPonUpdatePhoneNumber (phoneNumber, otp) {
  const query = {
    created_at: { $gte: new Date().getLastMinutesTime(15) },
    phone_number: phoneNumber,
    event: 'UPDATE_PHONE'
  }
  const skip = 0; const limit = 0
  const sort = { _id: -1 }

  const otpList = await OtpDataServiceProvider.getAllOtps(query, skip, limit, sort)

  const matchedIndex = otpList.findIndex(obj => obj.otp === otp)

  if (matchedIndex > -1) {
    return {
      verified: true,
      message: 'OTP verified with updated phone number'
    }
  }

  return {
    verified: false,
    message: 'Incorrect OTP'
  }
}

export {
  signIn,
  signUp,
  profile,
  updateProfile,
  updatePassword,
  updatePhone,
  resetPhone,
  resetPassword,
  updateUserProfilePic,
  listAllUsers,
  updateUser,
  deleteUser,
  listAllUsersWithFilter,
  forgotPassword,
}
