let whitelist = ['http://example1.com', 'http://192.168.0.61:7000', 'http://192.168.0.61:4200', 'http://49.207.185.190:4200', 'http://49.207.185.190:7000', 'http://localhost:4200', 'http://localhost:44233', 'https://coinlivret.yoursdemo.com', 'https://walletex.yoursdemo.com', 'https://walletexnft.yoursdemo.com']


export default function originRestrictor(req, res, next) {
    const origin = req.get('Origin') || req.get('Referer') || req.header('Origin') ||  req.header('Referer') || '';
    if(process.env.PRODUCTION=="true"){
        if (whitelist.indexOf(origin) !== -1) {
            res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
            res.setHeader('Access-Control-Allow-Methods', ' POST,GET, OPTIONS, PUT, PATCH, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
            res.setHeader('Access-Control-Allow-Credentials', true);
            next();
        }
        else {
            res.status(403).json({ message: 'Access denied: domain not allowed.' });
        }
    }
    else{
        next();
    }
}