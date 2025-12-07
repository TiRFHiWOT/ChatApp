import Pusher from "pusher";

if (!process.env.PUSHER_APP_ID) {
  throw new Error("PUSHER_APP_ID is not set");
}

if (!process.env.PUSHER_KEY) {
  throw new Error("PUSHER_KEY is not set");
}

if (!process.env.PUSHER_SECRET) {
  throw new Error("PUSHER_SECRET is not set");
}

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER || "us2",
  useTLS: true,
});
