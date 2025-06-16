# LLM Podcast Generator

A full-stack application that creates AI-powered podcast conversations using multiple LLM providers and Azure Speech Services.

## Features

- **Multi-LLM Support**: OpenAI, Azure OpenAI, LM Studio, and Ollama
- **Text-to-Speech**: Azure Speech Services integration with voice selection
- **Interactive UI**: Modern React frontend with TypeScript and Tailwind CSS
- **Conversation Management**: Create, save, and replay podcast conversations
- **Export Options**: Download conversation transcripts
- **Cross-Platform**: Runs on Mac and Windows

## Tech Stack

### Backend
- **C# ASP.NET Core 8.0** - Web API
- **Microsoft Semantic Kernel** - LLM integration
- **Entity Framework Core** - Database ORM
- **SQLite** - Local database
- **Azure Cognitive Services Speech** - Text-to-speech

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Axios** - HTTP client
- **Lucide React** - Icons

## Prerequisites

- **.NET 8.0 SDK** - [Download](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **npm** - Comes with Node.js

## Quick Start

1. **Clone and Setup**
   ```bash
   cd "LLM Podcast"
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install
   
   # Restore backend dependencies
   cd ../backend
   dotnet restore
   ```

3. **Configure LLM Providers**
   - Run the application
   - Click "Settings" in the top-right corner
   - Add your LLM provider configurations:
     - **OpenAI**: Requires API key
     - **Azure OpenAI**: Requires API key, endpoint, and deployment name
     - **LM Studio**: Requires local endpoint (usually http://localhost:1234)
     - **Ollama**: Requires local endpoint (usually http://localhost:11434)

4. **Configure Azure Speech (Optional)**
   - Edit `backend/appsettings.json`
   - Add your Azure Speech Service key and region:
     ```json
     {
       "AzureSpeech": {
         "SubscriptionKey": "your-key-here",
         "Region": "your-region-here"
       }
     }
     ```

5. **Start the Application**
   ```bash
   # Option 1: Use the startup script
   node start.js
   
   # Option 2: Use VS Code (recommended)
   # Open the project in VS Code and press F5
   
   # Option 3: Start manually
   # Terminal 1 - Backend
   cd backend
   dotnet run
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger

## Usage

### Creating a Podcast

1. **Enter a Topic**: Describe what you want the podcast to discuss
2. **Configure Participants**: 
   - Add up to 4 participants (including host)
   - Set unique names and personas for each
   - Assign LLM providers to each participant
   - Select voices for text-to-speech (optional)
   - Designate one participant as the host
3. **Generate**: Click "Generate Podcast" to create the conversation
4. **Listen/Read**: Use the player to listen to audio or read the transcript

### Managing LLM Providers

1. Click "Settings" in the top-right corner
2. Add providers for different LLM services:
   - **OpenAI**: Enter your API key
   - **Azure OpenAI**: Enter API key, endpoint, and deployment name
   - **LM Studio**: Enter local server endpoint
   - **Ollama**: Enter local server endpoint and model name

## Development

### VS Code Setup

The project includes VS Code configuration for debugging:
- Press **F5** to start debugging
- Use **Ctrl+Shift+P** → "Tasks: Run Task" to run individual tasks

### Available Tasks

- `build-backend` - Build the C# backend
- `build-frontend` - Build the React frontend
- `start-backend` - Start the backend server
- `start-frontend` - Start the frontend dev server
- `start-full-stack` - Start both servers

### Project Structure

```
LLM Podcast/
├── backend/                 # C# ASP.NET Core API
│   ├── Controllers/         # API controllers
│   ├── Models/             # Data models and DTOs
│   ├── Services/           # Business logic
│   ├── Data/               # Entity Framework context
│   └── wwwroot/audio/      # Generated audio files
├── frontend/               # React TypeScript app
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── App.tsx         # Main app component
│   └── public/             # Static assets
├── .vscode/                # VS Code configuration
│   ├── launch.json         # Debug configuration
│   └── tasks.json          # Build tasks
└── start.js               # Startup script
```

## API Endpoints

### LLM Providers
- `GET /api/llmproviders` - Get all providers
- `POST /api/llmproviders` - Create provider
- `PUT /api/llmproviders/{id}` - Update provider
- `DELETE /api/llmproviders/{id}` - Delete provider

### Podcasts
- `GET /api/podcast` - Get all podcasts
- `GET /api/podcast/{id}` - Get podcast by ID
- `POST /api/podcast` - Create podcast
- `POST /api/podcast/{id}/generate` - Generate podcast content

### Speech
- `GET /api/speech/voices` - Get available voices

## Troubleshooting

### Common Issues

1. **"Cannot find module 'react'" errors**
   - Run `npm install` in the frontend directory

2. **Backend won't start**
   - Ensure .NET 8.0 SDK is installed
   - Run `dotnet restore` in the backend directory

3. **LLM provider connection fails**
   - Check your API keys and endpoints
   - For local providers (LM Studio/Ollama), ensure they're running

4. **Audio not generating**
   - Configure Azure Speech Service in appsettings.json
   - Audio generation is optional; text conversation will still work

### Support

For issues and questions:
1. Check the console/terminal for error messages
2. Verify all prerequisites are installed
3. Ensure LLM providers are properly configured

## License

This project is for educational and demonstration purposes.
