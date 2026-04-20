# React Agent Chat

A modern React application for interacting with AI agents powered by Claude. Features real-time streaming responses, tool/function calling capabilities, and persistent chat history.

## Features

- 🤖 **AI Agent Integration** - Powered by Claude 3.5 Sonnet
- 💬 **Real-time Streaming** - Watch responses stream in real-time
- 🔧 **Tool Calling** - Agents can use tools like weather, calculator, and web search
- 💾 **Persistent History** - Chat history saved locally
- 🎨 **Modern UI** - Clean, responsive interface with Tailwind CSS
- ⚡ **Fast Development** - Built with Vite for optimal DX

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **AI SDK**: Anthropic SDK (Claude)

## Project Structure

```
src/
├── components/           # UI Components
│   ├── chat/            # Chat-related components
│   │   ├── ChatPanel.tsx
│   │   ├── MessageList.tsx
│   │   └── MessageInput.tsx
│   └── common/          # Shared components
│       ├── Button.tsx
│       ├── LoadingSpinner.tsx
│       └── Modal.tsx
├── agent/               # Agent Core Logic
│   ├── Agent.ts         # Main Agent class
│   └── tools/           # Tool implementations
│       ├── weatherTool.ts
│       ├── calculatorTool.ts
│       └── webSearchTool.ts
├── hooks/               # Custom React Hooks
│   ├── useAgent.ts
│   ├── useChat.ts
│   └── useStream.ts
├── store/               # State Management
│   ├── chatStore.ts     # Chat history store
│   └── agentStore.ts    # Agent configuration store
├── types/               # TypeScript Types
│   ├── agent.ts
│   ├── chat.ts
│   └── tool.ts
└── utils/               # Utility Functions
    ├── messageFormatter.ts
    ├── constants.ts
    └── streamParser.ts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- An Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react-project
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Usage

1. **Enter API Key**: On first launch, enter your Anthropic API key
2. **Start Chatting**: Type a message and press Enter to send
3. **Watch Streaming**: Responses will stream in real-time
4. **Tool Usage**: Ask questions that trigger tools (weather, calculations, web search)

## Available Tools

### Weather Tool
Get current weather information for any location.
```
User: "What's the weather in Tokyo?"
Agent: [Uses weather tool to fetch Tokyo's weather]
```

### Calculator Tool
Perform mathematical calculations.
```
User: "What's 25 * 37?"
Agent: [Uses calculator tool]
```

### Web Search Tool
Search the web for information (simulated).
```
User: "Search for the latest React updates"
Agent: [Uses web search tool]
```

## Configuration

### Agent Configuration

Agents can be configured in [src/agent/Agent.ts](src/agent/Agent.ts):

```typescript
{
  id: 'default',
  name: 'Default Assistant',
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  max_tokens: 1024,
  tools: ['weather', 'calculator', 'web_search']
}
```

### Adding Custom Tools

Create a new tool in [src/agent/tools/](src/agent/tools/):

```typescript
export const myTool: Tool = {
  id: 'my-tool',
  name: 'my_tool',
  description: 'Tool description',
  parameters: [
    {
      name: 'param',
      type: 'string',
      description: 'Parameter description',
      required: true
    }
  ],
  execute: async (params) => {
    // Tool implementation
    return result;
  }
};
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Key Features

### Streaming Responses
The app uses Claude's streaming API for real-time response generation.

### Tool Calling
Agents can call external tools to perform actions and retrieve information.

### Persistent Storage
Chat history and agent configuration are persisted using Zustand's persistence middleware.

### Responsive Design
The UI is fully responsive and works on desktop and mobile devices.

## Troubleshooting

### API Key Issues
Make sure your Anthropic API key is valid and has sufficient credits.

### Build Issues
Try clearing the node_modules and reinstalling:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Styling Issues
If Tailwind classes aren't working, ensure:
1. Tailwind is properly configured in `tailwind.config.js`
2. `@tailwind` directives are in `src/index.css`
3. The CSS file is imported in `src/main.tsx`

## Future Enhancements

- [ ] Add more tools (file operations, code execution, etc.)
- [ ] Implement multi-agent conversations
- [ ] Add agent configuration UI
- [ ] Support for image/file uploads
- [ ] Export chat history
- [ ] Dark mode support
- [ ] PWA support

## License

MIT License - feel free to use this project for learning and development.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
