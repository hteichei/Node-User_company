const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/index');
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const {
  userauthentication,
  userauthorization,
  companyauthentication
} = require('../middleware/auth');

const { validate } = require('jsonschema');
const userSchema = require('../validation_schema/userSchema');
const APIError = require('../APIError');

router.get('', userauthentication, async function(req, res, next) {
  try {
    const data = await db.query('select * from users');

    return res.json(data.rows);
  } catch (err) {
    return next(err);
  }
});

router.post('', async function(req, res, next) {
  try {
    const validation = validate(req.body, userSchema);
    if (!validation.valid) {
      return next(
        new APIError(
          400,
          'Bad Request',
          validation.errors.map(e => e.stack).join('. ')
        )
      );
    }
    const hashedpassword = await bcrypt.hash(req.body.password, 10);
    const data = await db.query(
      'insert into users (first_name,last_name,email,photo,current_company,username,password ) values ($1,$2,$3,$4,$5,$6,$7) returning*',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.photo,
        req.body.current_company,
        req.body.username,
        hashedpassword
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.get('/:username', userauthentication, async function(req, res, next) {
  try {
    const user_data = await db.query('select * from users where username=$1', [
      req.params.username
    ]);
    const user_jobs = await db.query(
      'select * from jobs_users where username=$1',
      [req.params.username]
    );
    var jobs = user_jobs.rows.map(item => item.job_id);
    // user_data.rows[0].applied_to = jobs;
    return res.json(user_data.rows[0]);
  } catch (err) {
    return next(err);
  }
});
router.patch('/:username', userauthorization, async function(req, res, next) {
  try {
    const data = await db.query(
      'update users set first_name =$1 ,last_name=$2, email=$3 ,photo=$4, current_company=$6 , username=$7,password=$8 where username=$5 returning *',
      [
        req.body.first_name,
        req.body.last_name,
        req.body.email,
        req.body.photo,
        req.params.username,
        req.body.current_company,
        req.body.username,
        req.body.password
      ]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

router.delete('/:username', userauthorization, async function(req, res, next) {
  try {
    await db.query('delete from users where username=$1 returning*', [
      req.params.username
    ]);
    return res.json({ message: 'deleted' });
  } catch (err) {
    return next(err);
  }
});

// users can apply job and delete job
router.post('/:username/jobs/:job_id', async function(req, res, next) {
  try {
    const data = await db.query(
      'insert into jobs_users (job_id,user_id) values ($1,$2) returning*',
      [req.params.job_id, req.params.username]
    );
    return res.json(data.rows[0]);
  } catch (err) {
    return next(err);
  }
});

//Add a new route /users/auth. This route accepts a POST request with a username and password,
//and it returns a JWT if the username exists and the password is correct

router.post('/user-auth', async function(req, res, next) {
  try {
    const userfound = await db.query(
      'select * from users where username = $1',
      [req.body.username]
    );
    if (userfound.rows.length === 0) {
      return res.json({ message: 'Invalid Username' });
    }
    const passresult = await bcrypt.compare(
      req.body.password,
      userfound.rows[0].password
    );
    if (passresult == false) {
      return res.json({ message: 'invalid password' });
    } else {
      const token = jsonwebtoken.sign(
        {
          //user_id: userfound.rows[0].id,
          username: userfound.rows[0].username
        },
        'SECRETKEY'
      );
      return res.json({ token });
    }
  } catch (err) {
    return next(err);
  }
});
module.exports = router;
