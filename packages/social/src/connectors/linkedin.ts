/**
 * PayAid Social – LinkedIn connector stub.
 * Backend only; UI shows "Connect your social account".
 */

export async function connectAccount(
  _tenantId: string,
  _authCode: string,
  _redirectUri: string
): Promise<{ accountId: string }> {
  throw new Error('LinkedIn connect not implemented')
}

export async function postContent(
  _marketingPost: { content: string; mediaIds: string[] },
  _accountId: string,
  _getMediaUrl: (mediaId: string) => Promise<string | null>
): Promise<{ platformPostId: string }> {
  throw new Error('LinkedIn post not implemented')
}
