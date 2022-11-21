module.exports  = {
    publicPath: process.env.NODE_ENV  ===  'production'  ?  './'  :  '/'
}

process.env.NODE_ENV = 'development'

// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS']=true