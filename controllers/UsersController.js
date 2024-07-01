import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UsersController {
  postNew(req, res) {
    const newUser = {};
    const email = req.body.email;
    const password = req.body.password;

    if (!email) {
      return 
    }

  }
}
