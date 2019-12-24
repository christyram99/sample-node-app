import express from 'express'
import users from './users'
const router = express.Router()

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Donee Me' })
})

router.use(users)
export default router
