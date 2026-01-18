# NVIDIA NeMo Integration Setup

This guide explains how to set up the NVIDIA NeMo model integration for the chat agent.

## Prerequisites

1. Access to NVIDIA NeMo API or NVIDIA NIM Proxy
2. API endpoint URL
3. API key (if required by your deployment)

## Environment Variables

Create a `.env.local` file in the `web` directory with the following variables:

```bash
# Required: NeMo API endpoint URL
NEMO_API_URL=https://your-nemo-api-endpoint.com
# OR use NIM_PROXY_BASE_URL if using NVIDIA NIM Proxy
# NIM_PROXY_BASE_URL=https://your-nim-proxy-endpoint.com

# Optional: API Key if required
NEMO_API_KEY=your-api-key-here

# Optional: Model name (defaults to meta/llama-3.1-8b-instruct)
NEMO_MODEL=meta/llama-3.1-8b-instruct
```

## API Endpoint

The integration uses the `/v1/chat/completions` endpoint, which follows the OpenAI-compatible format:

- **Endpoint**: `POST /v1/chat/completions`
- **Request Format**: 
  ```json
  {
    "model": "meta/llama-3.1-8b-instruct",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ],
    "max_tokens": 512,
    "temperature": 0.7
  }
  ```

## Testing the Integration

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/chat` in your browser

3. Send a message in the chat interface

4. The chat will call the NeMo API and display the response

## Troubleshooting

### Error: "NeMo API configuration is missing"
- Make sure you've set `NEMO_API_URL` or `NIM_PROXY_BASE_URL` in your `.env.local` file
- Restart your Next.js server after adding environment variables

### Error: "NeMo API error: 401 Unauthorized"
- Check if your `NEMO_API_KEY` is correct
- Verify that your API key has the necessary permissions

### Error: "NeMo API error: 404 Not Found"
- Verify that your API endpoint URL is correct
- Ensure the endpoint path includes `/v1/chat/completions`

### Responses are slow
- The API response time depends on your NeMo deployment
- Consider adjusting `max_tokens` in the API route if responses are too long
- Check your network connection to the NeMo API

## Customization

You can customize the NeMo integration by modifying `web/app/api/chat/route.ts`:

- **Temperature**: Adjust `temperature` (0.0-1.0) for more deterministic or creative responses
- **Max Tokens**: Change `max_tokens` to control response length
- **Streaming**: Set `stream: true` to enable streaming responses (requires additional frontend handling)

## Additional Resources

- [NVIDIA NeMo Microservices Documentation](https://docs.nvidia.com/nemo/microservices/)
- [NVIDIA NIM Proxy Documentation](https://docs.nvidia.com/nemo/microservices/latest/run-inference/nim-proxy/chat-completions.html)



