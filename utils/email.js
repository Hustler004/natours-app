const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

const catchAsync = require('./catchAsync');

// new Email(user,url).sendWelcome();

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Agam Agarwal <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return 1;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // Activate in gmail "less secure app" option
    });
  }

  //send the actual mail
  async send(template, subject) {
    //1. render HTML based on a pug template
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
    );
    //2. define the email options
    const emailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      // text: htmlToText.fromString(html),
    };
    //3. create a transport and send email
    await this.newTransport().sendMail(emailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for only 10 mins)',
    );
  }
};

// const sendEmail = catchAsync(async (options) => {
//   //1. Create a transporter
//   // const transporter = nodemailer.createTransport({
//   //   host: process.env.EMAIL_HOST,
//   //   port: process.env.EMAIL_PORT,
//   //   secure: process.env.EMAIL_PORT === '465',
//   //   auth: {
//   //     user: process.env.EMAIL_USERNAME,
//   //     pass: process.env.EMAIL_PASSWORD,
//   //   },
//   // Activate in gmail "less secure app" option
//   // });
//   //2. Define the email options
//   //3. actually send the email`
//   // try {
//   //   const result = await transporter.sendMail(emailOptions);
//   // } catch (err) {
//   //   console.log('error here!', err.message);
//   // }
// });

// module.exports = sendEmail;
