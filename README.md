# Meteor 'accounts' packages that use CouchDB

This project builds on the super effort of [@slava](https://github.com/Slava) and [@stubailo](https://github.com/stubailo) in producing pluggable meteor 'accounts' packages that can use other supported databases for the account information storage. Their initial work was tied to the [postgres support](https://github.com/meteor/postgres-packages/tree/master/packages) in meteor. This  builds on that base and also provided back contributions that we hope helps take the effort of pluggable accounts backends forward.  

This repo implements the pluggable accounts interface for CouchDB using the cloudant:couchdb meteor package and can be consumed by applications. It also provides the simple-todos app that uses these packages. 

## curent requirements
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
meteor remove accounts-password
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


