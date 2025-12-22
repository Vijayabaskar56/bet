import nodemailer from 'nodemailer'

let transporter = nodemailer.createTransport({
        host: 'sg1-ts103.a2hosting.com',
        port: 465,
        auth: {
                user: '',
                pass: ''
        },
});
export const sendMail = (to) => {

        transporter.sendMail({
                from: 'w2@breedcoins.com', // sender address
                to: `${to}`, // list of receivers seperated by comma
                subject: 'Account Verification', // Subject line
                html: "Hello,<br> Please Click on the link to verify your email.<br><a href=url>Click here to verify</a>"
        }, (error, info) => {
                if (error) {
                        return error
                }
                transporter.close();
                return info
        });
}


// sendMail()
