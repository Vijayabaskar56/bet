import { S3Client } from "bun";
import crypto from "crypto";
import multer from "multer";
import multerS3 from "multer-s3";

const secret_key =
	process.env.S3_SECRET_KEY || "oG7/LqM3XFmLs4KagbKcUjmDjTivBGbDpL2Wf3B3UEo";
const accessId = process.env.S3_ACCESS_ID || "DO00FXVVQZJMZR8CUWDF";
const region = process.env.S3_REGION || "sgp1";
const endpoint =
	process.env.S3_ENDPOINT || "https://sgp1.digitaloceanspaces.com/";
const bucket_name = process.env.S3_BUCKET_NAME || "firebee";

export const s3 = new S3Client({
	endpoint: endpoint,
	accessKeyId: accessId,
	secretAccessKey: secret_key,
	region: region,
});

export const fileFilters = (req: any, file: any, cb: any) => {
	const allowedMimeTypes = [
		"image/gif",
		"audio/mpeg",
		"image/png",
		"image/jpg",
		"image/jpeg",
		"application/octet-stream",
		"video/mp4",
		"video/MPEG-4",
		"video/mkv",
		"video/3gpp",
	];
	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

export const storage = multer.diskStorage({
	destination: "uploads",
	filename: (req, file, cb) => {
		cb(null, file.fieldname + "-" + Date.now() + ".jpg");
	},
});

export const uploadBannerImage = multer({
	storage: multerS3({
		s3: s3,
		bucket: bucket_name,
		acl: "public-read",
		key: (request, file, cb) => {
			crypto.randomBytes(16, (err, hash) => {
				if (err) cb(err);
				let filename = `${hash.toString("hex")}-${file.originalname}`;
				filename = filename.replace(/[^A-Z0-9]/gi, "_");
				cb(null, "uploads/banners/" + filename);
			});
		},
	}),
	fileFilter: fileFilters,
});

export const bannerImage = uploadBannerImage.fields([
	{
		name: "banner_image",
		maxCount: 1,
	},
]);
