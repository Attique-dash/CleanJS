const nodemailer = require("nodemailer");

const sendMail = async (email, username) => {
  try {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Clean JS Shipping Website" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Clean JS Shipping Website ",
      text: `Hi ${username}, welcome! You have been added to Clean JS Shipping website.`,
    });

    console.log(" Email sent to:", email);
  } catch (error) {
    console.error(" Email Error:", error.message);
  }
};

module.exports = sendMail;
