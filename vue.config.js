module.exports  = {
    publicPath: process.env.NODE_ENV  ===  'production'  ?  './'  :  '/'
}

// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true