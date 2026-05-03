/**
 * PayAid Social – Facebook connector stub.
 * Backend only; UI shows "Connect your social account" (no provider brand).
 */

export interface OAuthTokens {
  accessToken: string
  refreshToken?: string
  expiresAt?: string
}

/**
 * Save tokens after OAuth callback. Implement with your DB (e.g. SocialMediaAccount or OAuthIntegration).
 */
export async function connectAccount(
  _tenantId: string,
  _authCode: string,
  _redirectUri: string
): Promise<{ accountId: string }> {
  // TODO: exchange authCode for tokens, persist, return accountId
  throw new Error('Facebook connect not implemented')
}

/**
 * Publish content + media to Facebook. Implement with Graph API.
 */
export async function postContent(
  _marketingPost: { content: string; mediaIds: string[] },
  _accountId: string,
  _getMediaUrl: (mediaId: string) => Promise<string | null>
): Promise<{ platformPostId: string }> {
  // TODO: upload media, create post
  throw new Error('Facebook post not implemented')
}
