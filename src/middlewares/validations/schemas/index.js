
/** Users Common APIs */
import UserSignInDataSchema from './users/userSignInDataSchema'
import UserSignUpDataSchema from './users/userSignUpDataSchema'
import UpdateProfileDataSchema from './users/updateProfileDataSchema'

const SchemasMap = {
  '/sign-in': UserSignInDataSchema,
  '/sign-up': UserSignUpDataSchema,
  '/profile': {
    multi: true,
    patch: UpdateProfileDataSchema
  },
}

export default SchemasMap
