const Pusher = require("pusher");

// Pusher real-time is OPTIONAL. Only initialise the client when credentials are
// present, otherwise sendPusherNotification becomes a safe no-op so the app (and
// the deadline cron) run without a Pusher account.
const pusherConfigured = Boolean(
  process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET
);

const pusher = pusherConfigured
  ? new Pusher({
      appId: process.env.PUSHER_APP_ID,
      key: process.env.PUSHER_KEY,
      secret: process.env.PUSHER_SECRET,
      cluster: process.env.PUSHER_CLUSTER || "ap2",
      useTLS: true,
    })
  : null;

if (!pusherConfigured) {
  console.warn("⚠️  PUSHER_* not set — real-time notifications disabled (no-op).");
}

// Send real-time notifications to a specific user's channel
const sendPusherNotification = async (userId, message, dueDate, prograss, taskId) => {
  if (!pusher) return; // no-op when Pusher isn't configured

  const channel = `user-${userId}`; // unique channel per user
  pusher.trigger(channel, "new-notification", {
    message: message,
    dueDate: dueDate,
    prograss: prograss,
    taskId: taskId,
  });
};


// const sendPushBeamNotification = async (userId, message) => {

//     console.log("userID", userId);

//     try {
//       const publishResponse = await beamsClient.publishToUsers([userId], {
//         web: {
//           notification: {
//             title: "New Notification",
//             body: message,
//           },
//         },
//       });
//       console.log("Push notification sent:", publishResponse);
//     } catch (err) {
//       console.error("Error sending push notification:", err);
//     }  
//   };



module.exports = { sendPusherNotification};

