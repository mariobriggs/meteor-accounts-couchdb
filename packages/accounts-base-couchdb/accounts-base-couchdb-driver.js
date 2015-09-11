/**
 * Copyright (c) 2015 IBM Corporation
 * Copyright (C) 2011--2015 Meteor Development Group
 *
 * Permission is hereby granted, free of charge, to any person obtaining 
 * a copy of this software and associated documentation files (the 
 * "Software"), to deal in the Software without restriction, including 
 *  without limitation the rights to use, copy, modify, merge, publish, 
 *  distribute, sublicense, and/or sell copies of the Software, and to 
 *  permit persons to whom the Software is furnished to do so, 
 *  subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be 
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE 
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION 
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION 
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

AccountsDBClientCouchDB = class AccountsDBClientCouchDB {
  constructor () {
    
    // contains emails, username & services.password
    this.Users = new CouchDB.Database("users");
    // contains services.resume.loginTokens & other which require frequent 
    // updates. By separate db, allows easier inserts/deletes rather than whole replace
    this.UserServices = new CouchDB.Database("users-services");
    
    this.UserServices._ensureIndex([{service_name: 'asc'}, {key: 'asc'}]);
    this.UserServices._ensureIndex([{user_id: 'asc'},{service_name: 'asc'}, {key: 'asc'}]);
    
    this.Users._ensureIndex({'emails.0.address': 'asc'});
    this.Users._ensureIndex({'username': 'asc'});
  }
  
  
  getUserById(id) {
  	var user =  this.Users.findOne(id);
    // dont think the resume tokens are needed by the caller,
    // so commented out, to reduce db calls that
    // go from users-services->user->users-services
    // put back on need basis
    //if ( user !== undefined )
    //  user.services.resume = this._getResumeService(id);
    return user;
  }
  
  // this is a logout
  removeHashedLoginToken(userId, token) {
    // delete from Users the services.resume.loginTokens.token=token
    var tokenDoc = this.UserServices.findOne({
                         user_id: userId,
                         service_name: 'resume',
                         key: 'loginTokens',
                         value: token,
                        });
    if (tokenDoc !== undefined ) {
      this.UserServices.remove(tokenDoc._id);
    }
    
  }
  
  // remove all login tokens of a user except the 
  // specified logintoken
  removeOtherHashedLoginTokens(userId, token) {
    var us = this.UserServices;
    this.UserServices.find({
      user_id: userId,
      service_name: 'resume',
      key: 'loginTokens',
      value: { $ne: token},
     }).forEach(function(doc) {
       us.remove(doc._id);
     });
  }
  
  //expire login tokens by timestamp for user
  expireResumeTokens(userId,oldestValidDate) {
    var us = this.UserServices;
    this.UserServices.find({
      user_id: userId,
      service_name: 'resume',
      key: 'loginTokens',
      $or: [
            { created_at: { $lt: oldestValidDate } },
            { created_at: { $lt: +oldestValidDate } }
          ]
     }).forEach(function(doc) {
       us.remove(doc._id);
     });
  }
  
  // insert a logintoken
  //Timestamp is optional
  insertHashedLoginToken(userId, token, timestamp) {
    this._insertServiceRecords('resume', { loginTokens: token } , userId, timestamp);
  }
    
  getUserByHashedLoginToken(hashedToken) {
    var userToken = this.UserServices.findOne({
                         service_name: 'resume',
                         key: 'loginTokens',
                         value: hashedToken,
                        });
    
    if (userToken === undefined)
      return null;
    var userId;
    userId = userToken.user_id;
    
    // this one needs the resumelogin tokens
    //return userId && this.getUserById(userId);
    var user =  this.Users.findOne(userId);
    if ( user !== undefined )
      user.services.resume = this._getResumeService(userId);
    return user;
  }
  
  
  //Insert a user, passing it in as a complete JSON blob...
  // XXX the loginTokens will not be part of insert user
  // so no real TXN as such.
  insertUserDoc(fullUserDoc) {
    fullUserDoc = _.clone(fullUserDoc);
    var servicesSection = _.clone(fullUserDoc.services) || {};
    delete fullUserDoc.services;
    
    // will let username, services.password & emails remain in users
    // since those or not updated frequently as loginTokens
    var pwdService = _.clone(servicesSection.password) || {};
    fullUserDoc.services = { password: pwdService };
    delete servicesSection.password;
    
    var userId;
    userId = this.Users.insert(fullUserDoc);
    
    if (! _.isEmpty(servicesSection.services)) {
        Object.keys(servicesSection.services).forEach((serviceName) => {
          console.log('WARNING..... not handling TXNS' + serviceName);
          this._insertServiceRecords(
            serviceName,
            servicesSection.services[serviceName],
            userId
          );
        });
    }
    return userId;
  }
  
  getUserByServiceIdAndName(serviceName, serviceId) {
    // XXX could this be password - not seen this function called yet
    var userId = this.UserServices.findOne({
      service_name: serviceName,
      key: 'id',
      value: serviceId,
     }).user_id;
    
    return userId && this.getUserById(userId);
  }
  
   
  setServiceData(userId, serviceData) {
    // XXX could this be emails -  not seen this function called yet
    if (! _.isEmpty(serviceData)) {
      Object.keys(serviceData).forEach((serviceName) => {
        this._insertServiceRecords(
          serviceName,
          serviceData[serviceName],
          userId
        );
      });
    }
    
  }
  
  setupObserves(userId, subscription) {
    self = this;
    
    this.obUser = this.Users.find(userId)
              .observe({
                added: Meteor.bindEnvironment(userChanged),
                changed: Meteor.bindEnvironment(userChanged),
                removed: Meteor.bindEnvironment(userRemoved)
              });
              
    //xxx probably need to put back observe on users-services
    // to handle implicit logouts when resume.logintokens are
    // expired. read some comment to that effect.                    
    function userChanged(newDoc) {
      var user = self.getUserById(userId);
      subscription.added("users", userId, user);
    }
    
    function userRemoved() {
      throw new Error("WTF");
    }
  }
  
  stopObserves() {
    this.obUser.stop();
  }
  
  
  deleteAllResumeTokens(userId) {
    var local = this.UserServices;
    var selector;
    if (userId) {
      selector = {user_id: userId}
    }
    
    selector = _.extend( {
      service_name: 'resume',
      key: 'loginTokens'
      },selector);
    
    this.UserServices.find(selector)
        .forEach(function(doc) {
          local.remove(doc._id);
    });
  
  }
  
  //update password and remove other login tokens
  updatePassword(userId, newHashedPwd, currentResumeLoginToken) {
    var user =  this.Users.findOne(userId);
    if (!user)
      throw new Error('User not found');
    
    user.services.password.bcrypt = newHashedPwd;
    delete user.services.password.reset;
    this.Users.update(user);
    
    this.removeOtherHashedLoginTokens(userId,currentResumeLoginToken);
    
  }
  
  
  _insertServiceRecords(serviceName, serviceData, userId, timestamp) {
    serviceRecords = Object.keys(serviceData).map((key) => {
       token = serviceData[key];

      //var idkey = userId + '.' + serviceName + '.' + key + '.' + token;
      this.UserServices.insert({
        user_id: userId,
        service_name: serviceName,
        key: key,
        value: token,
        created_at: new Date(timestamp)
      });
    
    });
  }
  
  _getResumeService(userId) {
    
    var loginTokens = this.UserServices.find({user_id: userId}).fetch();
    
    const formattedLoginTokens = loginTokens.map((loginToken) => {
      return {
        hashedToken: loginToken.value,
        when: new Date(loginToken.created_at).getTime()
      }
    });

    return {
      loginTokens: formattedLoginTokens
    }
  }
}

Meteor.AccountsDBClient =  AccountsDBClientCouchDB;
  
