let JwtStrategy = require('passport-jwt').Strategy;
let ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models').user;

// module.exports被執行的時候會自動套入passport的套件
module.exports = (passport) => {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
  opts.secretOrKey = process.env.PASSPORT_SECRET;

  passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
      try {
        let foundUser = await User.findOne({ _id: jwt_payload._id })
          .select('-password') // 不回傳密碼欄位
          .exec();
        if (foundUser) {
          // 從 payload 補上 role，避免再次查詢
          foundUser.role = jwt_payload.role;
          return done(null, foundUser); //req,user <= foundUser
        } else {
          return done(null, false);
        }
      } catch (e) {
        return done(e, false);
      }
    })
  );
};
