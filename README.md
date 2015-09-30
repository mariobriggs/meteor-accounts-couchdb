# Meteor 'accounts' packages that use CouchDB

## What is this project about
The Meteor [Accounts system](http://docs.meteor.com/#/full/accounts_api) and [Password package](http://docs.meteor.com/#/full/accounts_passwords) stores its data by default in a MongoDB collection. This project allows you to configure Meteor to store this data in a Apache CouchDB database.

This project builds on the super effort of [@slava](https://github.com/Slava) and [@stubailo](https://github.com/stubailo) in producing pluggable meteor 'accounts' packages that can use other supported databases for the account information storage. Their initial work was tied to the [postgres support](https://github.com/meteor/postgres-packages/tree/master/packages) in meteor. This  builds on that base and also provided back [contributions](https://github.com/meteor/postgres-packages/pull/18) that we hope helps take the effort of pluggable accounts backends forward. 
 

This repo implements the pluggable accounts interface for CouchDB using the [cloudant:couchdb](https://github.com/cloudant/meteor-couchdb) meteor package and can be consumed by applications. It also provides the simple-todos app that uses these packages. 

## current requirements
In your app's .meteor/packages file, 'accounts-password-couchdb' needs to come before 'accounts-password'. An example shown below

``` 
# Meteor packages used by this project, one per line.
# Check this file (and the other files in this directory) into your repository.
#
# 'meteor add' and 'meteor remove' will edit this file for you,
# but you can also edit it by hand.

meteor-platform
accounts-password-couchdb
accounts-password
....
```  

### Error  and Success messages to be aware

If you see this message at startup, it means that accounts-password-couchdb is not defined ahead of other accounts-xxx packages in your .meteor/packages file. Fix it by editing that file.

```  
Error: Mongo accounts-password not plugged in yet
...   at new AccountsServer (packages/accounts-base/accounts_server.js:...)
```  

If everything went well, you should see the following message at startup in the console

``` 
Using pluggable accounts-password AccountsDBClientCouchDB 
```  


## Using the accounts-password-couchdb package with your application
``` 
#clone this repo
git clone https://github.com/mariobriggs/meteor-accounts-couchdb.git
  
#copy the packages folder to your app
cp -rf meteor-accounts-couchdb/packages/ <your_app_folder>/packages

# change to your app folder
cd <your_app_folder>

#set the package_dirs variable
export PACKAGE_DIRS=./packages

#pull in these packages

# first remove any 'accounts' packages, so that we can setup that the couchdb
# accounts packages are defined first.  This is a current req.
meteor remove accounts-password accounts-ui

# now add accounts-password-couchdb first followed by any other required
# accounts package
meteor add accounts-password-couchdb accounts-password

# Fake MONGO_URL so that Meteor doesn't start MongoDB for us
export MONGO_URL="nope"

#set the couchDB to work with
export COUCHDB_URL=https://username:password@account.cloudant.com

#start your app
meteor run

```  

## Using the sample app provided
``` 
#clone this repo
git clone https://github.com/mariobriggs/meteor-accounts-couchdb.git

# change to the app folder
cd meteor-accounts-couchdb/app

#set the package_dirs variable
export PACKAGE_DIRS=../packages

#set the couchDB to work with
export COUCHDB_URL=https://username:password@account.cloudant.com

# Fake MONGO_URL so that Meteor doesn't start MongoDB for us
export MONGO_URL="nope"

#start your app
meteor run

```  


### note
This repo contains a duplicate copy of the accounts-base and accounts-password packages from [ meteor postgres](https://github.com/meteor/postgres-packages/tree/master/packages) for ease of use of the Apache CouchDB consumer (just clone a single repo) at this point in time.  
  
Look forward to the changes in meteor postgres's accounts and password packages making its way into core meteor accounts and password package, at which time couchdb accounts and password package can be released independently. 

update : Right now our [PullRequst]((https://github.com/meteor/postgres-packages/pull/18)) has been merged, so looks like we are headed in the right direction