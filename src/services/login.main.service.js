import nodemailer from "nodemailer";


export const loginMail = async (name, email, password) => {
  try {


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });


    const html = `
      <h2>Admin Account Created</h2>
      <p>Hello ${name},</p>
      <p>Your administrator account is ready.</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Password:</b> ${password}</p>
      <p>Please login and change your password immediately.</p>
    `;

    const mailOptions = {
      from: `"${process.env.MAIL_NAME}" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Admin Login Credentials",
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Admin mail sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("Mail error:", error);
    throw error;
  }
};
