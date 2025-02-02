import type { ErrorResponse } from '@/libs'
import type {
  SecuritySchemaOpenId,
  Server,
} from '@scalar/oas-utils/entities/spec'
import { shouldUseProxy } from '@scalar/oas-utils/helpers'

type OpenIDConfiguration = {
  issuer: string
  authorizationEndpoint: string
  tokenEndpoint: string
  supportedGrantTypes: string[]
}

/**
 * Gets the OpenID Connect configuration
 */
const getConfiguration = async (
  openIdConnectUrl: string,
  proxyUrl?: string,
): Promise<ErrorResponse<OpenIDConfiguration>> => {
  try {
    // Check if we should use the proxy
    const url = shouldUseProxy(proxyUrl, openIdConnectUrl)
      ? `${proxyUrl}?${new URLSearchParams([['scalar_url', openIdConnectUrl]]).toString()}`
      : openIdConnectUrl

    const response = await fetch(url)

    const {
      issuer,
      authorization_endpoint,
      token_endpoint,
      grant_types_supported,
    } = await response.json()

    return [
      null,
      {
        issuer: issuer,
        authorizationEndpoint: authorization_endpoint,
        tokenEndpoint: token_endpoint,
        supportedGrantTypes: grant_types_supported,
      },
    ]
  } catch (e) {
    return [new Error('Failed to get OpenID Connect configuration'), null]
  }
}

/**
 * Authorize OpenID Connect
 *
 * @returns the accessToken
 */
export const authorizeOpenIdConnect = async (
  scheme: SecuritySchemaOpenId,
  /** We use the active server to set a base for relative redirect uris */
  activeServer: Server,
  proxyUrl?: string,
): Promise<ErrorResponse<string>> => {
  try {
    const openIdConnectConfiguration = await getConfiguration(
      scheme.openIdConnectUrl,
      proxyUrl,
    )
    if (openIdConnectConfiguration[0]) return openIdConnectConfiguration

    return [null, '']
  } catch (e) {
    return [new Error('Failed to authorize OpenID Connect'), null]
  }
}
