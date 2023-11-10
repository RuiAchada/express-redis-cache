/**

  cache.ls()
  ##########

  This script is supposed to be called via `index.js`

**/

module.exports = function (
  /* Function */ callback // Callback
) {
  /** set in /index.js **/
  var self = this;

  var domain = require("domain").create();

  domain.on("error", function (error) {
    callback(error);
  });

  domain.run(function () {
    // Adjusted to handle empty or null prefix properly
    let keyPattern = self.prefix ? self.prefix + "*" : "*";

    /** Tell Redis to fetch the keys name beginning by prefix **/
    self.client.keys(
      keyPattern,
      domain.intercept(function (keys) {
        var size = 0;

        require("async").parallel(
          /** for each keys **/

          keys.map(function (key) {
            return function (cb) {
              // Adjusted to correctly handle the key without prefix
              var adjustedKey = self.prefix
                ? key.replace(new RegExp("^" + self.prefix), "")
                : key;
              self.get(adjustedKey, cb);
            }.bind({ key: key });
          }),

          domain.intercept(function (results) {
            results.forEach(function (result) {
              size += require("./sizeof")(result);
            });

            callback(null, size);
          })
        );
      })
    );
  });
};
