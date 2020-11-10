import Joi from 'joi'

const UserSignUpSchema = Joi.object().keys({
  name: Joi.string().required(),
  email: Joi.string().required(),
  mobile_number: Joi.string().required(),
})

export default UserSignUpSchema
