import { Cut, Feed, Image, Line, PrinterEngine, Text, TikTokPrinterClient, avatarUrl, fetchImage, giftTotal, isGiftComplete } from "tiktok-live-printer";

// Prints one receipt per gift: avatar, @username, "THANKS FOR 3 X Rose".
const client = new TikTokPrinterClient({
  uniqueId: process.env.TIKTOK_UNIQUE_ID ?? "@someone",
  apiKey: process.env.EULER_API_KEY,
  printer: PrinterEngine.usb(),
});

client.on("WebcastGiftMessage", async (msg) => {
  if (!isGiftComplete(msg)) return;

  const url = avatarUrl(msg.user);
  const avatar = url ? await fetchImage(url).catch(() => undefined) : undefined;

  await client.queue(
    ...(avatar ? [Image(avatar, 160)] : []),
    Text(`@${msg.user?.displayId}`, { bold: true, align: "center" }),
    Text(`THANKS FOR ${giftTotal(msg)} X ${msg.gift?.name}`, { align: "center" }),
    Line(),
    Feed(2),
    Cut(),
  );
});

client.on("disconnected", ({ code, reason }) => console.log(`disconnected (${code}): ${reason}`));

await client.connect();
console.log("connected, waiting for gifts");
