import { S3Client } from '@aws-sdk/client-s3'
import crypto from 'crypto'
import dotenv from 'dotenv'
import multer from 'multer'
import multerS3 from 'multer-s3'
import { siteSetting } from '../model/adminModel.js'
// eslint-disable-next-line no-unused-vars
let imgLimit;
(async () => {
    let result = await siteSetting.findOne({})
    imgLimit = result?.image_lmt
})();
dotenv.config();
const secret_key = "oG7/LqM3XFmLs4KagbKcUjmDjTivBGbDpL2Wf3B3UEo";
const accessId = "DO00FXVVQZJMZR8CUWDF";
const region = "sgp1";
const endpoint = "https://sgp1.digitaloceanspaces.com/";
const bucket_name = 'firebee';

// const spacesEndpoint = new aws.Endpoint(endpoint);
const s3 = new S3Client({
    endpoint: endpoint,
    credentials: {
        accessKeyId: accessId, // store it in .env file to keep it safe
        secretAccessKey: secret_key
    },
    region: region // this is the region that you select in AWS account
})


const fileFilters = (req, file, cb, next) => {
    if (file.mimetype == 'image/gif' || file.mimetype == 'audio/mpeg' || file.mimetype == 'image/png' || file.mimetype == 'image/jpg' || file.mimetype == 'image/jpeg' || file.mimetype == 'application/octet-stream' || file.mimetype == 'video/mp4' || file.mimetype == 'video/MPEG-4' || file.mimetype == 'video/mkv' || file.mimetype === 'video/3gpp') {
        cb(null, true)
        next
    } else {
        cb(null, false)
    }
}


const storage = multer.diskStorage({
    destination: 'uploads',
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + '.jpg')
    }
})



const uploadBannerImage = multer({
    storage: multerS3({
        s3: s3,
        bucket: bucket_name,
        acl: "public-read", // storage access type
        key: function (request, file, cb) {
            crypto.randomBytes(16, (err, hash) => {
                if (err) cb(err);
                let filename = `${hash.toString('hex')}-${file.originalname}`;
                filename = filename.replace(/[^A-Z0-9]/ig, "_");
                cb(null, "uploads/banners/" + filename);
            });
        }
    }), fileFilter: fileFilters,
});
const bannerImage = uploadBannerImage.fields([{
    name: 'banner_image', maxCount: 1
}])


export {
    bannerImage,
    storage
}
