import nodemailer from "nodemailer";
import jwt from 'jsonwebtoken';
import { generateVoucher } from '../voucher/generateVoucher.js'
import { sendWhatsapp } from './send.Whatsapp.js'


export const sendMail = async (emails, usersData, amount, status) => {
  try {

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    let html = ''
    let hasAttachment;

    const formatDate = () => {
      return new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    };


    if (status == 'fail') {

      const host = process.env.RETRYLINK;
      const bulkRefId = usersData.bulkRefId;
      const logId = usersData.logId;
      const razorpay_payment_id = usersData.razorpay_payment_id;
      const razorpay_order_id = usersData.razorpay_order_id;
      const userData = usersData.userData;
      const errors = usersData.error;
      const order = usersData.order

      const token = createRetryToken({
        bulkRefId,
        logId,
        errors,
        userData,
        order
      })
      const url = host + token;

      sendWhatsapp(emails.primaryUserWhatsapp, formatDate(), emails.guestName, null, 'failed', bulkRefId)

      html = paymentFailedTemplate({
        amount,
        bulkRefId,
        logId,
        razorpay_payment_id,
        razorpay_order_id,
        userData,
        retryPaymentUrl: url
      })
    } else {

      const pdfBuffer = await getData(usersData.bulkRefId, usersData.userData)
      sendWhatsapp(emails.primaryUserWhatsapp, formatDate(), emails.guestName, pdfBuffer, 'success', usersData.bulkRefId)

      hasAttachment = [
        {
          filename: 'voucher.pdf',
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]

      html = paymentSuccessTemplate({
        amount,
        bulkRefId: usersData.bulkRefId,
        logId: usersData.logId,
        razorpay_payment_id: usersData.razorpay_payment_id,
        razorpay_order_id: usersData.razorpay_order_id,
        userData: usersData.userData,
        retryPaymentUrl: ""
      })
    }

    // Mail options
    const mailOptions = {
      from: `"${process.env.MAIL_NAME}" <${process.env.MAIL_USER}>`,
      to: emails.primaryUser,
      cc: emails.secondaryUsers || [],
      bcc: 'madan.ghodechor@cotrav.co',
      subject: `Payment ${status == 'fail' ? 'Declined, Booking Still Pending' : 'Successful'}`,
      html: html,
      attachments: hasAttachment
    };

    const info = transporter.sendMail(mailOptions);

    console.log("Mail sent:", info.messageId);
    return info;

  } catch (error) {
    console.error("Mail error:", error);
    throw error;
  }
};

export function paymentFailedTemplate(data) {
  const {
    amount,
    bulkRefId,
    logId,
    razorpay_payment_id,
    razorpay_order_id,
    userData,
    retryPaymentUrl
  } = data;

  const roomsHtml = userData.map((room, index) => {
    const roomNumber = index + 1;
    const attendeesHtml = room.attendees.map(att => `
      <tr>
        <td style="font-size:12px;">${att.firstName} ${att.lastName}</td>
        <td style="font-size:12px;">${att.email}</td>
        <td style="font-size:12px;">${att.phone}</td>
      </tr>
    `).join('');

    return `
      <table width="100%" cellpadding="8" cellspacing="0"
        style="border:1px solid #e0e0e0;border-radius:6px;margin-bottom:12px;">
        
        <tr style="background:#f9fafb;">
          <td colspan="2" style="font-size:14px;font-weight:bold;">
            Room ${roomNumber}: ${room.roomtype} occupancy
          </td>
        </tr>

        <tr>
          <td style="font-size:13px;color:#555;">Check-in</td>
          <td style="font-size:13px;">${room.checkIn}</td>
        </tr>

        <tr>
          <td style="font-size:13px;color:#555;">Check-out</td>
          <td style="font-size:13px;">${room.checkOut}</td>
        </tr>

        <tr>
          <td colspan="2" style="padding-top:10px;">
            <table width="100%" cellpadding="6" cellspacing="0">
              <tr style="background:#eeeeee;">
                <th align="left" style="font-size:12px;">Name</th>
                <th align="left" style="font-size:12px;">Email</th>
                <th align="left" style="font-size:12px;">Phone</th>
              </tr>
              ${attendeesHtml}
            </table>
          </td>
        </tr>
      </table>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Payment Failed</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:24px;">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#ffffff;border-radius:8px;overflow:hidden;">

<tr>
<td style="background:#d32f2f;color:#ffffff;padding:20px;">
  <h2 style="margin:0;font-size:20px;">❌ Payment Failed</h2>
  <p style="margin:6px 0 0;font-size:14px;">
    Your booking payment could not be processed
  </p>
</td>
</tr>

<tr>
<td style="padding:20px;">
<table width="100%" cellpadding="6" cellspacing="0">
<tr>
  <td style="font-size:14px;color:#555;">Amount</td>
  <td style="font-size:14px;text-align:right;">₹${amount}</td>
</tr>
<tr>
  <td style="font-size:14px;color:#555;">Booking ID</td>
  <td style="font-size:14px;text-align:right;">${bulkRefId}</td>
</tr>
</table>
</td>
</tr>


<tr>
<td style="padding:0 20px 20px;">
<h3 style="margin:0 0 10px;font-size:16px;">Booking Details</h3>
${roomsHtml}
</td>
</tr>

<tr>

<td style="padding:20px;text-align:center;">
<a href="${retryPaymentUrl}"
 style="background:#1976d2;color:#ffffff;text-decoration:none;
 padding:12px 20px;border-radius:6px;font-size:14px;">
 Retry Payment
</a>
</td>
</tr>

<tr>
<td style="background:#f1f1f1;padding:16px;text-align:center;font-size:12px;color:#777;">
  <!-- Contact <b>support@yourcompany.com</b> -->
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

async function getData(bulkRefId, userData) {

  let primaryAttendeeName;
  let primaryAttendeeEmail;

  const attendees = userData[0].attendees.map(guest => {
    if (guest.is_primary_user) {
      primaryAttendeeEmail = guest.email
      primaryAttendeeName = guest.firstName + ' ' + guest.lastName
    }
    return {
      "name": guest?.firstName + ' ' + guest.lastName,
      "email": guest?.email,
      "phone": guest?.phone,
    }
  })

  const formatToDDMMYY = (dateString) => {
    const d = new Date(dateString);

    const day = String(d.getDate()).padStart(2, '0');

    const month = d.toLocaleString('en-IN', { month: 'short' });

    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  }
  const getTodayDDMonYYYY = () => {
    const d = new Date();

    const day = String(d.getDate()).padStart(2, '0');
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();

    return `${day} ${month} ${year}`;
  }



  let roomtype = userData[0]?.roomtype;
  let checkIn = formatToDDMMYY(userData[0]?.checkIn);
  let checkOut = formatToDDMMYY(userData[0]?.checkOut);

  let payload = {
    "bookingId": bulkRefId,
    "createdAt": getTodayDDMonYYYY(),
    "primaryAttendeeName": primaryAttendeeName,
    "primaryAttendeeEmail": primaryAttendeeEmail,
    "rooms": [
      {
        "type": roomtype,   // Triple, Double, Single
        "checkIn": checkIn,
        "checkOut": checkOut,
        "guests": attendees
      }
    ]
  }
  const pdfBuffer = await generateVoucher(payload);

  return pdfBuffer
}

export function paymentSuccessTemplate(data) {
  const {
    amount,
    bulkRefId,
    logId,
    razorpay_payment_id,
    razorpay_order_id,
    userData
  } = data;

  const roomsHtml = userData.map((room, index) => {
    const roomNumber = index + 1;
    const attendeesHtml = room.attendees.map(att => `
      <tr>
        <td style="font-size:12px;">${att.firstName} ${att.lastName}</td>
        <td style="font-size:12px;">${att.email}</td>
        <td style="font-size:12px;">${att.phone}</td>
      </tr>
    `).join('');

    return `
      <table width="100%" cellpadding="8" cellspacing="0"
        style="border:1px solid #e0e0e0;border-radius:6px;margin-bottom:12px;">
        
        <tr style="background:#f3fdf6;">
          <td colspan="2" style="font-size:14px;font-weight:bold;">
            Room ${roomNumber}: ${room.roomtype} occupancy
          </td>
        </tr>

        <tr>
          <td style="font-size:13px;color:#555;">Check-in</td>
          <td style="font-size:13px;">${room.checkIn}</td>
        </tr>

        <tr>
          <td style="font-size:13px;color:#555;">Check-out</td>
          <td style="font-size:13px;">${room.checkOut}</td>
        </tr>

        <tr>
          <td colspan="2" style="padding-top:10px;">
            <table width="100%" cellpadding="6" cellspacing="0">
              <tr style="background:#e8f5e9;">
                <th align="left" style="font-size:12px;">Name</th>
                <th align="left" style="font-size:12px;">Email</th>
                <th align="left" style="font-size:12px;">Phone</th>
              </tr>
              ${attendeesHtml}
            </table>
          </td>
        </tr>
      </table>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Payment Successful</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:24px;">
<table width="600" cellpadding="0" cellspacing="0"
  style="background:#ffffff;border-radius:8px;overflow:hidden;">

<tr>
<td style="background:#2e7d32;color:#ffffff;padding:20px;">
  <h2 style="margin:0;font-size:20px;">✅ Payment Successful</h2>
  <p style="margin:6px 0 0;font-size:14px;">
    Your booking has been confirmed successfully
  </p>
</td>
</tr>

<tr>
<td style="padding:20px;">
<table width="100%" cellpadding="6" cellspacing="0">
<tr>
  <td style="font-size:14px;color:#555;">Amount Paid</td>
  <td style="font-size:14px;text-align:right;">₹${amount}</td>
</tr>
<tr>
  <td style="font-size:14px;color:#555;">Booking ID</td>
  <td style="font-size:14px;text-align:right;">${bulkRefId}</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 20px 20px;">
<h3 style="margin:0 0 10px;font-size:16px;">Payment Details</h3>
<table width="100%" cellpadding="8" cellspacing="0"
  style="border:1px solid #e0e0e0;border-radius:6px;">
<tr>
  <td style="font-size:13px;color:#555;">Payment ID</td>
  <td style="font-size:13px;">${razorpay_payment_id}</td>
</tr>
<tr>
  <td style="font-size:13px;color:#555;">Order ID</td>
  <td style="font-size:13px;">${razorpay_order_id}</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:0 20px 20px;">
<h3 style="margin:0 0 10px;font-size:16px;">Booking Details</h3>
${roomsHtml}
</td>
</tr>

<!--
<tr>
<td style="background:#f1f1f1;padding:16px;text-align:center;font-size:12px;color:#777;">
This email confirms successful payment and booking.<br/>
For assistance, contact <b>support@yourcompany.com</b>
</td>
</tr>
-->

</table>
</td>
</tr>
</table>
</body>
</html>
`;
}



const JWT_SECRET = process.env.JWT_SECRET || 'MadanIsSecreate';

export function createRetryToken(usersData) {
  const payload = {
    bulkRefId: usersData.bulkRefId,
    logId: usersData.logId,
    errors: usersData.errors,
    userData: usersData.userData,
    order: usersData.order
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '10h'
  });
}