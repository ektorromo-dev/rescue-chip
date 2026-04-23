'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function MetaPixelPurchase() {
  const searchParams = useSearchParams()
  const amount = searchParams.get('amount')

  useEffect(() => {
    if (amount && typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'Purchase', {
        value: parseFloat(amount),
        currency: 'MXN',
      })
      console.log('Meta Pixel: Purchase tracked -', amount, 'MXN')
    }
  }, [amount])

  return null
}
