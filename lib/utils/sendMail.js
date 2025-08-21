import nodemailer from 'nodemailer';

const sendMail = async (email, username) => {
  try {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Clean JS Shipping" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🚢 Welcome to Clean JS Shipping!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1f2937; text-align: center;">🚢 Clean JS Shipping</h1>
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

    await transporter.sendMail(mailOptions);
    console.log(` Email sent to: ${email}`);
    return { success: true };

  } catch (error) {
    console.error(' Email Error:', error.message);
    return { success: false, error: error.message };
  }
};

export default sendMail;