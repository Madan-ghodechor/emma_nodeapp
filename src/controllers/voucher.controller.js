
import { sendMail } from "../services/mailer.service.js";
export const sendVoucherController = async (req, res) => {
  try {

      const booking = req.body;

      const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};
      
      // Find primary user
    const primaryUser = booking.attendees.find(
      (a) => a.is_primary_user === true
    );

    if (!primaryUser) {
      return res.status(400).json({
        success: false,
        message: "Primary user not found"
      });
      }
      
      const formattedBooking = {
          ...booking,
          roomtype: booking.roomType,
          checkIn: formatDate(booking.checkIn),
          checkOut: formatDate(booking.checkOut)

};

    // Email data
    const emails = {
      primaryUser: primaryUser.email,
      secondaryUsers: [],
      primaryUserWhatsapp: primaryUser.phone,
      guestName: primaryUser.firstName
    };

    // Voucher data
    const usersData = {
      bulkRefId: booking.bulkRefId,
      logId: booking._id,
      razorpay_payment_id: booking.payment?.razorpay_payment_id,
      razorpay_order_id: booking.payment?.razorpay_order_id,
      whiteLabel: {
        // assets: {
        //   headerFirstLogoUrl: "",
        //   headerSecondLogoUrl: "",
        //   headerThirdLogoUrl: ""
        // },
        // themeMainColor: "#1976d2",
          // themeSecondaryColor: "#f4f6f8"

           assets: booking.whiteLabel?.assets || {},
  themeMainColor: booking.whiteLabel?.themeMainColor || "#1976d2",
  themeSecondaryColor: booking.whiteLabel?.themeSecondaryColor || "#f4f6f8"
          

      },
      userData: [formattedBooking]
    };

    const amount = booking.payment?.paymentAmount;
    const status = "success";

    // Send voucher email
    await sendMail(emails, usersData, amount, status);


   

    res.json({
      success: true,
      message: "Voucher sent successfully"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to send voucher"
    });

  }
};