import nodemailer from 'nodemailer';

const sendMail = async (email, username) => {
  try {
    console.log(' Starting email process...');
    console.log(' Email recipient:', email);
    console.log(' Username:', username);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error(' Email credentials missing!');
      throw new Error('Email credentials not configured');
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      secure: false,
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();

    const logoUrl = process.env.NODE_ENV === "production"
      ? "https://clean-js-git-main-muhammad-attiques-projects.vercel.app/logo.png"
      : "http://localhost:3000/logo.png";

    const mailOptions = {
      from: `"Clean JS Shipping" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Clean JS Shipping!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center;">
            <img src="${logoUrl}" 
                 alt="Clean JS Logo" 
                 style="width: 100px; height: auto; margin-bottom: 10px;" />
          </div>
          <h1 style="color: #1f2937; text-align: center;">Clean JS Shipping</h1>
          <h2 style="color: #374151;">Welcome, ${username}!</h2>
          <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
            Thank you for joining Clean JS Shipping! Your account has been successfully created.
          </p>
          <div style="background-color: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">What's Next?</h3>
            <ul style="color: #374151;">
              <li>Explore our shipping services</li>
              <li>Track your packages</li>
              <li>Manage your shipments</li>
            </ul>
          </div>
          <p style="color: #6b7280; text-align: center; margin-top: 30px;">
            Best regards,<br><strong>Clean JS Shipping Team</strong>
          </p>
        </div>
      `,
      text: `Welcome to Clean JS Shipping, ${username}! Your account has been created successfully.`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(' Email sent successfully!', result.messageId);

    return { success: true, messageId: result.messageId };

  } catch (error) {
    console.error(' Email Error Details:', error);
    return { success: false, error: error.message };
  }
};

export default sendMail;
