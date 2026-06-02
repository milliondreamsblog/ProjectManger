const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID_C,
  process.env.GOOGLE_CLIENT_SECRET_C,
  "http://localhost:5001/api/calendar/google/callback"
);

function getAuthUrl() {
  const scopes = ["https://www.googleapis.com/auth/calendar"];
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
  });
}

function setCredentials(tokens) {
  oauth2Client.setCredentials(tokens);
}

async function createCalendarEvent(eventData) {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  console.log("Creating event in Google Calendar with data:", eventData);
  const event = {
    summary: eventData.title,
    location: eventData.location,
    description: eventData.description,
    start: {
      dateTime: new Date(eventData.startDate).toISOString(),
      timeZone: "Asia/Kolkata",
    },
    end: {
      dateTime: new Date(eventData.endDate).toISOString(),
      timeZone: "Asia/Kolkata",
    },
    attendees: eventData.attendeesEmails?.map(email => ({ email })) || [],
  };

  const res = await calendar.events.insert({
    calendarId: "primary",
    requestBody: event,
  });

  return res.data;
}

module.exports = {
  getAuthUrl,
  setCredentials,
  createCalendarEvent,
};
