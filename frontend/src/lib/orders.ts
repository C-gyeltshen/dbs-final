const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'

export type DeliveryAddress = {
  street: string
  city: string
  country: string
  zip: string
}

export type PlaceOrderItem = {
  productId: string
  quantity: number
}

export type PlaceOrderInput = {
  items: PlaceOrderItem[]
  deliveryAddress: DeliveryAddress
}

export type PlacedOrder = {
  order: {
    id: string
    status: 'PLACED'
    total: number
  }
}

export const placeOrder = async (accessToken: string, input: PlaceOrderInput) => {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(input),
  })
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    const message = body && typeof body === 'object' && 'error' in body
      ? String(body.error)
      : 'Order could not be placed.'

    throw new Error(message)
  }

  return body as PlacedOrder
}
