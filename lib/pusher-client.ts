"use client";

import Pusher from "pusher-js";

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "us2";

if (!pusherKey) {
  console.warn("NEXT_PUBLIC_PUSHER_KEY is not set. Pusher will not work.");
}

let pusherClient: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (!pusherKey) {
    return null;
  }

  if (pusherClient) {
    return pusherClient;
  }

  // Create Pusher with custom authorizer to include token
  pusherClient = new Pusher(pusherKey, {
    cluster: pusherCluster,
    authorizer: (channel: any, options: any) => {
      return {
        authorize: (socketId: string, callback: Function) => {
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("token")
              : null;

          if (!token) {
            callback(new Error("No auth token found"), null);
            return;
          }

          fetch("/api/pusher/auth", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then((res) => {
              if (!res.ok) {
                return res.json().then((data) => {
                  throw new Error(data.error || "Auth failed");
                });
              }
              return res.json();
            })
            .then((data) => {
              callback(null, data);
            })
            .catch((err) => {
              console.error("Pusher auth error:", err);
              callback(err, null);
            });
        },
      };
    },
    enabledTransports: ["ws", "wss"],
  });

  return pusherClient;
}
