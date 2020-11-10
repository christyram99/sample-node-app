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

export {
  signIn,
  signUp,
}
