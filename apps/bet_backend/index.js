import express from 'express'
import cors from 'cors'
import http from "http";
import contextService from "request-context";
import responseEncryptor from './middleware/responseEncryptor.js'
import originRestrictor from './middleware/originRestrictor.js'
import socketService from './service/socketService.js'
// import axios from 'axios';
const app = express();
app.use(cors({
    origin: "*"
}))
app.use(contextService.middleware('request'));
import 'dotenv/config'
const server = http.createServer(app)
socketService.setIo(server)
import useragent from "express-useragent";
app.disable('x-powered-by');

// eslint-disable-next-line no-unused-vars
import { connectToDatabase } from './db/index.js';
import { adminRoute, masterRoute, userRoute, bettingRoute } from './routes/index.js';
import bettingService from './service/bettingService.js';
import cronService from './service/cronService.js';
// import createTestData from './seed.js';

app.use(useragent.express());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(responseEncryptor);
app.use(originRestrictor);

// createTestData();
app.use('/uploads', express.static('uploads'));
app.use('/images', express.static('images'));
app.use('/assets', express.static('assets'));


app.get(["/", "/api"], (req, res) => {
    return res.status(200).send({ status: "hello world" })
})

app.use('/admin', adminRoute)
app.use('/user', userRoute)
app.use('/masteragent', masterRoute)
app.use('/betting', bettingRoute)


server.listen(process.env.PORT, () => {
    console.log(`server is listening on the port  ${process.env.PORT}`)
    cronService.init();
})
