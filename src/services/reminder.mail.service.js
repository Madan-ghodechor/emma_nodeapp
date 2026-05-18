import nodemailer from "nodemailer";

export const emmaRegistrationReminderMail = async (data) => {
  try {
    const { name, paymentLink, email } = data;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    const html = emmaReminderTemplate({ name, paymentLink });

    const mailOptions = {
      from: `"${process.env.MAIL_NAME}" <${process.env.MAIL_USER}>`,
      to: email,
      bcc: 'madan.ghodechor@cotrav.co',
      subject: `Reserve Your Stay – Hotel Room Booking for ${process.env.EVENT_NAME}`,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("EEMA reminder mail sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("EEMA reminder mail error:", error);
    throw error;
  }
};

function emmaReminderTemplate({ name, paymentLink }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reserve Your Hotel Room – East Conclave 2026</title>
</head>
<body style="margin:0;padding:0;background:#f0f3f5;font-family:Georgia,'Times New Roman',serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f3f5;">
  <tr>
    <td align="center" style="padding:36px 16px;">

      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a4a5c 0%,#245f73 55%,#2e7d96 100%);padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 32px 6px 32px;">
                  <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:400;color:#ffffff;line-height:1.25;letter-spacing:0.5px;">East Conclave 2026</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 32px 0 32px;">
                  <table cellpadding="0" cellspacing="0"><tr>
                    <td style="width:48px;height:2px;background:#c9a84c;"></td>
                    <td style="width:8px;height:2px;background:rgba(201,168,76,0.35);"></td>
                    <td style="width:4px;height:2px;background:rgba(201,168,76,0.15);"></td>
                  </tr></table>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 32px 24px 32px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:4px;padding:6px 14px;">
                        <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:600;letter-spacing:1.5px;color:rgba(255,255,255,0.85);text-transform:uppercase;">9 &amp; 10 June 2026</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px 12px 32px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#2c2c2c;line-height:26px;">

            <p style="margin:0 0 20px 0;">Dear <strong style="color:#1a4a5c;">${name}</strong>,</p>

            <p style="margin:0 0 20px 0;">
              We're delighted to have you as a registered delegate for <strong>East Conclave 2026</strong>.
            </p>

            <p style="margin:0 0 20px 0;">
              To make your experience seamless, we'd like to invite you to reserve your hotel room at <strong>Mayfair Tea Resort</strong> — the official venue hotel for the event. You can book your stay conveniently through <strong>COTRAV</strong>, our trusted travel partner.
            </p>

            <!-- Highlight box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
              <tr>
                <td style="border-left:3px solid #c9a84c;padding:14px 20px;background:#fdfaf4;">
                  <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4a3a1a;line-height:24px;">
                    <strong>Event:</strong> East Conclave 2026<br/>
                    <strong>Date:</strong> 9th &amp; 10th June 2026<br/>
                    <strong>Hotel:</strong> Mayfair Tea Resort<br/>
                    <strong>Booking Partner:</strong> COTRAV
                  </p>
                </td>
              </tr>
            </table>

            <p style="margin:0 0 32px 0;">
              Rooms are limited and allocated on a first-come, first-served basis. Click the button below to secure your stay.
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px 0;">
              <tr>
                <td align="center">
                  <a href="${paymentLink}"
                     style="background:#1a4a5c;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:6px;display:inline-block;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.5px;">
                    Reserve Your Room Now
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 32px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px;background:#e8e8e8;"></td></tr></table>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="padding:24px 32px 32px 32px;">
            <p style="margin:0 0 4px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#888;letter-spacing:0.3px;">Warm regards,</p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#1a4a5c;letter-spacing:0.5px;">Team COTRAV</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1a4a5c;padding:16px 32px;">
            <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.5px;">© 2026 COTRAV · Your Trusted Travel Partner</p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
`;
}

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
              <p style="margin-top:0;">Hi ${name},</p>

              <p>
                This is a reminder to complete your registration for the ${process.env.EVENT_NAME}.
              </p>

              <p>
                Your booking at Pragati Resort is currently pending. Kindly secure your stay by completing
                the registration at the earliest.
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
                For any assistance, contact person: Nistha | 8840165393.
              </p>
              <p>
                We look forward to welcoming you.
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
      subject: `Reminder: Complete Your Registration – ${process.env.EVENT_NAME}`,
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
