/**
 * A handful of helper functions that are used throughout the examples
 */

module.exports = {

  //Generate a random string used for dummy data
  getRandomString: function(requiredStringLength) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i=0; i<5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  },

  //Generate a random int used for dummy data
  getRandomInt: function(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
  }

};
