import nodemailer from "nodemailer";

export const reminderMail = async (data) => {
    try {

        const { name, paymentLink, email } = data;

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });


        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Payment Reminder</title>
</head>

<body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background:#0d6efd; padding:20px; text-align:center;">
              <h2 style="color:#ffffff; margin:0;">Payment Reminder</h2>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px; color:#333333; font-size:14px; line-height:22px;">
              <p style="margin-top:0;">Dear ${name},</p>

              <p>
                This is a gentle reminder regarding your hotel registration for 
                <strong>South Factor</strong>.
              </p>

              <p>
                Room occupancy is filling up quickly, and we noticed that your payment 
                is still pending, which means your room is not yet confirmed.
              </p>

              <p>
                To secure your stay, please complete your payment at the earliest using 
                the link below:
              </p>

              <!-- Button -->
              <p style="text-align:center; margin:30px 0;">
                <a href="${paymentLink}" 
                   style="background:#0d6efd; color:#ffffff; text-decoration:none; padding:12px 25px; border-radius:4px; display:inline-block; font-weight:bold;">
                  Complete Payment
                </a>
              </p>

              <p>
                Should you need any support, Team Cotrav is here to assist.
              </p>

              <p style="margin-bottom:0;">
                Warm regards,<br />
                <strong>Team Cotrav</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

        const mailOptions = {
            from: `"${process.env.MAIL_NAME}" <${process.env.MAIL_USER}>`,
            to: email,
            bcc: 'madan.ghodechor@cotrav.co',
            subject: "Action Required: Confirm Your South Factor Stay",
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
