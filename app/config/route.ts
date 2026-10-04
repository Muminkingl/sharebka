import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const configuredSignalingServer = (process.env.NEXT_PUBLIC_SIGNALING_SERVER || process.env.SIGNALING_SERVER || "")
    .replace(/^https?:\/\//i, "");
  const signalingServer = configuredSignalingServer
    ? configuredSignalingServer.replace(/\/+$/, "") + "/"
    : false;

  return NextResponse.json({
    signalingServer,
    buttons: {
      donation_button: { active: process.env.DONATION_BUTTON_ACTIVE, link: process.env.DONATION_BUTTON_LINK, title: process.env.DONATION_BUTTON_TITLE },
      twitter_button: { active: process.env.TWITTER_BUTTON_ACTIVE, link: process.env.TWITTER_BUTTON_LINK, title: process.env.TWITTER_BUTTON_TITLE },
      mastodon_button: { active: process.env.MASTODON_BUTTON_ACTIVE, link: process.env.MASTODON_BUTTON_LINK, title: process.env.MASTODON_BUTTON_TITLE },
      bluesky_button: { active: process.env.BLUESKY_BUTTON_ACTIVE, link: process.env.BLUESKY_BUTTON_LINK, title: process.env.BLUESKY_BUTTON_TITLE },
      custom_button: { active: process.env.CUSTOM_BUTTON_ACTIVE, link: process.env.CUSTOM_BUTTON_LINK, title: process.env.CUSTOM_BUTTON_TITLE },
      privacypolicy_button: { active: process.env.PRIVACYPOLICY_BUTTON_ACTIVE, link: process.env.PRIVACYPOLICY_BUTTON_LINK, title: process.env.PRIVACYPOLICY_BUTTON_TITLE },
    },
  });
}
