import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import redisClient from './redis.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface MailParams {
  email: string;
  subject: string;
  template: string;
  cc?: string;
  [key: string]: any;
}

export const sendMail = async (params: MailParams): Promise<{ status: boolean; message: string }> => {
  return new Promise(async (resolve) => {
    const transporter = nodemailer.createTransport({
      host: 'sg1-ts103.a2hosting.com',
      port: 465,
      auth: {
        user: process.env.MAIL,
        pass: process.env.PASS
      },
      tls: {
        rejectUnauthorized: false
      },
    });

    const viewsPath = path.resolve(__dirname, '../views');

    const handlebarsOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: viewsPath,
        defaultLayout: false,
      },
      viewPath: viewsPath,
      extName: ".handlebars",
    };

    transporter.use('compile', hbs(handlebarsOptions as any));

    const info: any = {
      from: '"Betting" <Betting@betting.com>',
      to: params.email,
      subject: params.subject,
      template: params.template,
      context: { params },
    };

    if (params.cc) {
      info.cc = params.cc;
    }

    const mailSend = () => {
      transporter.sendMail(info, async (err) => {
        if (!err) {
          resolve({
            status: true,
            message: 'commonmessage.mailsendsuccess'
          });
        } else {
          resolve({
            status: false,
            message: err.message
          });
        }
      });
    };

    const obj = {
      from: info.from,
      to: info.to,
      subject: info.subject,
      sendingTime: new Date().toLocaleDateString() + "_" + new Date().toLocaleTimeString()
    };

    const redisDataRaw = await redisClient.get('NodeMail');
    let redisData = redisDataRaw ? JSON.parse(redisDataRaw) : null;

    if (redisData) {
      const currentDate = new Date().toLocaleDateString();
      if (redisData.date === currentDate) {
        if (redisData.mailCount && (Number(redisData.mailCount) + 1) <= 1500) {
          redisData.details.push(obj);
          const data = {
            date: redisData.date,
            mailCount: Number(redisData.mailCount) + 1,
            startTime: redisData.startTime,
            details: redisData.details
          };
          await redisClient.set('NodeMail', JSON.stringify(data));
          return mailSend();
        } else {
          resolve({
            status: false,
            message: "Today MailSend Limit Reached"
          });
        }
      } else {
        const data = {
          date: currentDate,
          mailCount: 1,
          startTime: new Date().toLocaleTimeString(),
          details: [obj]
        };
        await redisClient.set('NodeMail', JSON.stringify(data));
        mailSend();
      }
    } else {
      const data = {
        date: new Date().toLocaleDateString(),
        mailCount: 1,
        time: new Date().toLocaleTimeString(),
        details: [obj]
      };
      await redisClient.set('NodeMail', JSON.stringify(data));
      mailSend();
    }
  });
};
