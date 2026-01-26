/**
 * Internal E-Signature Service
 * PayAid's own signature system (no external dependencies)
 */

import { prisma } from '@/lib/db/prisma'
import { logger } from '@/lib/logging/structured-logger'

export interface SignatureRequest {
  documentId: string
  documentType: 'CONTRACT' | 'QUOTE'
  signerName: string
  signerEmail: string
  signerRole: 'PARTY' | 'US' | 'WITNESS'
  message?: string
}

export interface SignatureData {
  signatureId: string
  signatureUrl: string // Base64 signature image
  ipAddress?: string
  userAgent?: string
}

export class InternalSignatureService {
  /**
   * Request signature for a contract
   */
  static async requestContractSignature(
    tenantId: string,
    contractId: string,
    request: Omit<SignatureRequest, 'documentId' | 'documentType'>
  ): Promise<{ signatureId: string; signatureUrl: string }> {
    const contract = await prisma.contract.findFirst({
      where: { id: contractId, tenantId },
    })

    if (!contract) {
      throw new Error('Contract not found')
    }

    // Check if signature already exists
    const existing = await prisma.contractSignature.findFirst({
      where: {
        contractId,
        signerEmail: request.signerEmail,
      },
    })

    if (existing && existing.signedAt) {
      throw new Error('Contract already signed by this signer')
    }

    // Create or update signature request
    const signature = existing
      ? await prisma.contractSignature.update({
          where: { id: existing.id },
          data: {
            signerName: request.signerName,
            signerRole: request.signerRole,
            signatureMethod: 'MANUAL', // Internal signature system
          },
        })
      : await prisma.contractSignature.create({
          data: {
            contractId,
            signerName: request.signerName,
            signerEmail: request.signerEmail,
            signerRole: request.signerRole,
            signatureMethod: 'MANUAL',
          },
        })

    // Generate signature URL
    const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contracts/sign/${signature.id}`

    // Update contract status
    if (contract.status === 'DRAFT') {
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'PENDING_SIGNATURE' },
      })
    }

    // TODO: Send email with signature link
    logger.info('Contract signature requested', {
      contractId,
      signatureId: signature.id,
      signerEmail: request.signerEmail,
    })

    return {
      signatureId: signature.id,
      signatureUrl,
    }
  }

  /**
   * Request signature for a quote
   */
  static async requestQuoteSignature(
    tenantId: string,
    quoteId: string,
    request: Omit<SignatureRequest, 'documentId' | 'documentType'>
  ): Promise<{ signatureId: string; signatureUrl: string }> {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
    })

    if (!quote) {
      throw new Error('Quote not found')
    }

    // Create quote signature (if QuoteSignature model exists, otherwise use quote fields)
    // For now, we'll add signature fields to Quote model
    const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL}/quotes/sign/${quoteId}?signer=${encodeURIComponent(request.signerEmail)}`

    // Update quote status
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'pending_signature',
        signatureStatus: 'pending',
      },
    })

    logger.info('Quote signature requested', {
      quoteId,
      signerEmail: request.signerEmail,
    })

    return {
      signatureId: quoteId, // Using quoteId as signature identifier
      signatureUrl,
    }
  }

  /**
   * Sign a contract
   */
  static async signContract(
    tenantId: string,
    contractId: string,
    signatureData: SignatureData
  ): Promise<{ allSignaturesCollected: boolean }> {
    const signature = await prisma.contractSignature.findFirst({
      where: {
        id: signatureData.signatureId,
        contract: {
          id: contractId,
          tenantId,
        },
      },
    })

    if (!signature) {
      throw new Error('Signature request not found')
    }

    if (signature.signedAt) {
      throw new Error('Contract already signed by this signer')
    }

    // Update signature
    await prisma.contractSignature.update({
      where: { id: signature.id },
      data: {
        signedAt: new Date(),
        signatureUrl: signatureData.signatureUrl,
        ipAddress: signatureData.ipAddress,
        userAgent: signatureData.userAgent,
      },
    })

    // Check if all signatures collected
    const allSignatures = await prisma.contractSignature.findMany({
      where: { contractId },
    })

    const allSigned = allSignatures.every((sig) => sig.signedAt !== null)

    if (allSigned) {
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'ACTIVE', signedAt: new Date() },
      })
    }

    logger.info('Contract signed', {
      contractId,
      signatureId: signature.id,
      allSigned,
    })

    return { allSignaturesCollected: allSigned }
  }

  /**
   * Sign a quote
   */
  static async signQuote(
    tenantId: string,
    quoteId: string,
    signatureData: SignatureData & { signerEmail: string }
  ): Promise<void> {
    const quote = await prisma.quote.findFirst({
      where: { id: quoteId, tenantId },
    })

    if (!quote) {
      throw new Error('Quote not found')
    }

    // Update quote with signature
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: 'accepted',
        signatureStatus: 'signed',
        signedAt: new Date(),
        acceptedAt: new Date(),
      },
    })

    logger.info('Quote signed', {
      quoteId,
      signerEmail: signatureData.signerEmail,
    })
  }

  /**
   * Get signature status
   */
  static async getSignatureStatus(
    tenantId: string,
    documentId: string,
    documentType: 'CONTRACT' | 'QUOTE'
  ): Promise<{
    status: 'pending' | 'signed' | 'completed'
    signatures: Array<{
      signerName: string
      signerEmail: string
      signerRole: string
      signedAt: Date | null
    }>
  }> {
    if (documentType === 'CONTRACT') {
      const signatures = await prisma.contractSignature.findMany({
        where: {
          contract: {
            id: documentId,
            tenantId,
          },
        },
        orderBy: { createdAt: 'asc' },
      })

      const allSigned = signatures.every((sig) => sig.signedAt !== null)

      return {
        status: allSigned ? 'completed' : signatures.some((sig) => sig.signedAt) ? 'signed' : 'pending',
        signatures: signatures.map((sig) => ({
          signerName: sig.signerName,
          signerEmail: sig.signerEmail,
          signerRole: sig.signerRole,
          signedAt: sig.signedAt,
        })),
      }
    } else {
      // Quote
      const quote = await prisma.quote.findFirst({
        where: { id: documentId, tenantId },
      })

      if (!quote) {
        throw new Error('Quote not found')
      }

      return {
        status: quote.signatureStatus === 'signed' ? 'completed' : quote.signatureStatus === 'pending' ? 'pending' : 'signed',
        signatures: quote.signedAt
          ? [
              {
                signerName: quote.contact?.name || 'Unknown',
                signerEmail: quote.contact?.email || '',
                signerRole: 'PARTY',
                signedAt: quote.signedAt,
              },
            ]
          : [],
      }
    }
  }
}
