export const getMongoDBAPIHeader = (data) => ({
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Request-Headers': "*",
    "api-key": import.meta.env.MONGODB_API_KEY,
  },
  method: 'POST',
  body: JSON.stringify({
    "dataSource":"Cluster0",
    collection: "requestQuota",
    database: "shareLinkDB",
    ...data,
  }),
})

// Generate share link with request quota limit
export async function generateShareLink(quotaLimit: number, baseUrl: string): Promise<string> {
    try {
      const shareLinkId = Math.random().toString(36).substr(2, 10);
      const shareLink = `${baseUrl}?share_link_id=${shareLinkId}`;
      await fetch(`${import.meta.env.MONGODB_API_BASE_URL}/action/insertOne`, getMongoDBAPIHeader({
        document: {
          shareLinkId, quotaLimit, requests: 0 
        }
      })) as Response
      return shareLink;
    } catch(e) {
      return ""
    }
}
  

// Function to validate if the share link has reached the request quota
export async function isShareLinkQuotaReached(shareLinkId: string): Promise<boolean> {
  try {
    const findRes = await fetch(`${import.meta.env.MONGODB_API_BASE_URL}/action/findOne`, getMongoDBAPIHeader({
      filter: {
        shareLinkId,
      }
    })) as Response
    const shareLinkData = await findRes.json()
    if (shareLinkData?.document?.shareLinkId !== shareLinkId) {
        return true;
    }
    return shareLinkData.document.requests >= shareLinkData.document.quotaLimit;
  } catch(e) {
    return true;
  }
}


// Function to validate if the share link has reached the request quota
export async function isShareLinkQuotaReachedForGenerate(shareLinkId: string): Promise<boolean> {
  try {
    const findRes = await fetch(`${import.meta.env.MONGODB_API_BASE_URL}/action/findOne`, getMongoDBAPIHeader({
      filter: {
        shareLinkId,
      }
    })) as Response
    const shareLinkData = await findRes.json()
    if (shareLinkData?.document?.shareLinkId !== shareLinkId) {
        return true;
    }
    if (shareLinkData.document.requests >= shareLinkData.document.quotaLimit) {
      return true
    }
    const updateRes = await fetch(`${import.meta.env.MONGODB_API_BASE_URL}/action/updateOne`, getMongoDBAPIHeader({
      filter: {
        shareLinkId,
      },
      update: {
        "$set": {"requests": shareLinkData.requests+1}
    }
    })) as Response
    const updateShareLinkData = await updateRes.json()
    if (updateShareLinkData.modifiedCount !== 1) {
      return true
    }
    return false;
  } catch(e) {
    return true
  }
}