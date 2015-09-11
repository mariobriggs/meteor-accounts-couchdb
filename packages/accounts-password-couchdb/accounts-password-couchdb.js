AccountsDBClientCouchDB.prototype.getUserByUsername = function getUserByUsername(username) {
  var user = this.Users.findOne({username: username});
  return user;
}

AccountsDBClientCouchDB.prototype.getUserByEmail = function getUserByEmail(email) {
  var user = this.Users.findOne({'emails.0.address': email});
  return user;
}