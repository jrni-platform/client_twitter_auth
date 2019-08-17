const bbCore = require('sdk');

const URL= require('url');
var OAuth = require('oauth').OAuth;
var querystring= require('querystring')
var crypto = require("crypto");


// redirect over to twitter auth
function call_twitter_auth(event, callback, oauth){

  if (!event.passthrough)
    event.passthrough = true;
  
  oauth.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results) {
    if (error) {
      return callback(null, error);
    } else {
      bbCore.setTempValue(oauth_token, oauth_token_secret, 60*5)
    
      // write paathrough it out for 5 minutes as an accepted random state - also supporting a passthrough param
      bbCore.setTempValue(oauth_token+"_pass", event.passthrough, 60*5)

      callback(null, {
        proxy:true,
        status_code: 302,
        headers: {
          'Location':  "https://api.twitter.com/oauth/authenticate?oauth_token=" + oauth_token
        },
        response: "Redirect"
      });
    }
  });


}



module.exports = function(event, callback) {


    // load the config       
    const client_id = bbCore.getConfigValue("client_id");
    const consumer_secret = bbCore.getConfigValue("consumer_secret");
    const redirect_url = bbCore.getConfigValue("redirect_url");

    // get the url of this script!
    const callbackURI = "https://" + URL.parse(bbCore.context.apiUrl).host + "/app/client_twitter_auth/login";

    var oauth = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      client_id,
      consumer_secret,
      "1.0",
      callbackURI,
      "HMAC-SHA1"
    );

    if (event.oauth_verifier && event.oauth_token) {
      
      console.log("got auth back!!", event)

      // get the state
      const passthrough = bbCore.getTempValue(event.oauth_token + "_pass");
      if (!passthrough){
        // if you got an invalid state - try again - just in case it just expired
        return call_twitter_auth(event, callback, oauth);
      }

      const token_secret = bbCore.getTempValue(event.oauth_token)

      oauth.getOAuthAccessToken(
        event.oauth_token,
        token_secret,
        event.oauth_verifier,
        function(error, oauth_access_token, oauth_access_token_secret, results) {
          if (error) {
            return callback(null, error);
          }
          else {

              oauth.get(
                "https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true",
                oauth_access_token, oauth_access_token_secret,
                function(error, data) {
                  if(error) {
                      return callback(null, "FAILURE: " + require('sys').inspect(error))
                  }
                  else {

                    // now we start a customer journey using a custom sso
                    // use a slightly different temp variable as a nonce for the bookingbug custom sso section
                    const sso_nonce = crypto.randomBytes(20).toString('hex') + "s";
                    // store the data in  a temp variable
                    bbCore.setTempValue(sso_nonce, data, 60);

                    const host = redirect_url + "&passthrough=" + passthrough + "&sso=" + sso_nonce

                    // callback with a redirect
                    callback(null, {
                      proxy:true,
                      status_code: 302,
                      headers: {
                        'Location':  host
                      },
                      response: "Redirect"
                    });

                  
                  }
                }
              );              
            
            }
          }
        );
    }
    else {
        call_twitter_auth(event, callback, oauth);
    }
};
