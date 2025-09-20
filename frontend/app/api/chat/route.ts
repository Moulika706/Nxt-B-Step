export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch('https://ac-teamx.onrender.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    const data = await response.json()
    return Response.json(data)
  } catch (error) {
    console.error('Error proxying request:', error)
    return Response.json({ 
      error: 'Failed to fetch response',
      response: "Sorry, there was an error connecting to the chat service. Please try again later."
    }, { status: 500 })
  }
}
