import { MongoClient } from "mongodb";


async function initDB() {
  const client = new MongoClient(import.meta.env.MONGODB_URI);
  await client.connect();
  const db = client.db("shareLinkDB");
  const requestQuotaCollection = db.collection("requestQuota");
  return requestQuotaCollection;
}

// Generate share link with request quota limit
export async function generateShareLink(quotaLimit: number, baseUrl: string): Promise<string> {
    const requestQuotaCollection = await initDB();
    const shareLinkId = Math.random().toString(36).substr(2, 10);
    const shareLink = `${baseUrl}?share_link_id=${shareLinkId}`;
    await requestQuotaCollection.insertOne({ _id: shareLinkId, quotaLimit, requests: 0 });
    return shareLink;
}
  

// Function to validate if the share link has reached the request quota
export async function isShareLinkQuotaReached(shareLinkId: string): Promise<boolean> {
  const requestQuotaCollection = await initDB();
  const shareLinkData = await requestQuotaCollection.findOne({ _id: shareLinkId });
  if (!shareLinkData) {
      return true;
  }
  return shareLinkData.requests >= shareLinkData.quotaLimit;
}


// Function to validate if the share link has reached the request quota
export async function isShareLinkQuotaReachedForGenerate(shareLinkId: string): Promise<boolean> {
  const requestQuotaCollection = await initDB();
  const shareLinkData = await requestQuotaCollection.findOne({ _id: shareLinkId });
  if (!shareLinkData) {
      return true;
  }
  if (shareLinkData.requests >= shareLinkData.quotaLimit) {
    return true
  }
  await requestQuotaCollection.updateOne({ _id: shareLinkId }, {
    "$set": {"requests": shareLinkData.requests+1}
  })
  return false;
}