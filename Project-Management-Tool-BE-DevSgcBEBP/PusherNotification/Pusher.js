const Pusher = require("pusher");
const PushNotifications = require('@pusher/push-notifications-server');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "ap2", // Check the cluster in your Pusher app dashboard
  useTLS: true, // Ensure connection is secure
});

const beamsClient = new PushNotifications({
    instanceId: process.env.PUSHER_BEAMS_INSTANCE_ID,
    secretKey: process.env.PUSHER_BEAMS_SECRET_KEY,
  });

// Send real-time notifications to a specific channel
const sendPusherNotification = async (userId, message, dueDate, prograss, taskId) => {
  const channel = `user-${userId}`; 
// const channel = `user-67e3a0295a7adcd1fa91011c`;

   // Create a unique channel for each user

  // Trigger the notification event on that user's channel
  pusher.trigger(channel, "new-notification", {
    message: message,
    dueDate: dueDate,
    prograss: prograss,
    taskId: taskId
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

