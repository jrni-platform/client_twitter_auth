
const bbCore = require('sdk');

module.exports = function(event, callback) {
  
  // load the sso value
  let data = bbCore.getTempValue(event.token)
  
  if (!data){
      callback(null, {found: false, status: 'failed'})
      return;
  }
  
  data = JSON.parse(data)

  // load the client data
  const client = {
    email: data.email,
    first_name: data.name,
    last_name: "",
    ref: data.screen_name
  }

  callback(null, {found: true, status: 'success', data: client})

}

