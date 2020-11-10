import UserModel from '../../models/userModel'
import bcrypt from 'bcrypt'
const saltRounds = 12

class UserDataServiceProvider {
  async saveUser (userData) {
    // Hash Password
    userData.password = await bcrypt.hash(userData.password, saltRounds)
    return UserModel.create(userData)
  }

  async login (username, password) {
    let match = false
    const userDetails = await UserModel.findOne({ username: username })
    if (userDetails) { match = await bcrypt.compare(password, userDetails.password) }
    return match ? userDetails : null
  }

  async getAllUsers (query = {}, skip = 0, limit = 10, sort = {}) {
    return UserModel.find(query).skip(skip).limit(limit).sort(sort).select({ password: 0 })
  }

  async countAllUsers (query = {}) {
    return UserModel.countDocuments(query)
  }

  async getUserByUsername (username = '') {
    return UserModel.findOne({ username: username })
  }

  async getUserById (userId = '') {
    return UserModel.findById(userId)
  }

  async getUserByPhone (phoneNumber = '') {
    return UserModel.findOne({ phone_number: phoneNumber })
  }

  async updateUserById (userId, userData) {
    return UserModel.findByIdAndUpdate(userId, { $set: userData }, { new: true })
  }

  async deleteUserById (userId) {
    return UserModel.updateOne({ _id: userId }, { $set: { status: 'DELETED' } })
  }

  async updateUserPasswordById (userId, password) {
    const updatedPassword = await bcrypt.hash(password, saltRounds)
    return UserModel.updateOne({ _id: userId }, { $set: { password: updatedPassword } })
  }

  async updateUserProfilePicById (userId, profilePicPath) {
    return await UserModel.updateOne({ _id: userId }, { $set: { avatar: profilePicPath } })
  }

  async checkCurrentPassword (userId, password) {
    const user = await UserModel.findById(userId)

    return await bcrypt.compare(password, user.password)
  }

  async checkPhoneExistence (userId, phoneNumber) {
    return UserModel.findOne({ phone_number: phoneNumber, _id: { $ne: userId } })
  }
}

export default new UserDataServiceProvider()
