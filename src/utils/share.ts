import { MongoClient } from "mongodb";

const client = new MongoClient(import.meta.env.MONGODB_URI);
await client.connect();
const db = client.db("shareLinkDB");
const requestQuotaCollection = db.collection("requestQuota");


// Generate share link with request quota limit
export async function generateShareLink(quotaLimit: number): Promise<string> {
    const shareLinkId = Math.random().toString(36).substr(2, 10);
    const shareLink = `https://chatgpt.outshine.me/?share_link_id=${shareLinkId}`;
    await requestQuotaCollection.insertOne({ _id: shareLinkId, quotaLimit, requests: 0 });
    return shareLink;
}
  

// Function to validate if the share link has reached the request quota
export async function isShareLinkQuotaReached(shareLinkId: string): Promise<boolean> {
  const shareLinkData = await requestQuotaCollection.findOne({ _id: shareLinkId });
  if (!shareLinkData) {
      return true;
  }
  return shareLinkData.requests >= shareLinkData.quotaLimit;
}