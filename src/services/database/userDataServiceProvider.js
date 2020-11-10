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
}

export default new UserDataServiceProvider()
