import { useState } from 'react'; 
import { Play, Square, Download, Users, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { PodcastSession, PodcastStatus } from '../types';

interface PodcastPlayerProps {
  session: PodcastSession;
}

const PodcastPlayer = ({ session }: PodcastPlayerProps) => {
  const [currentMessage, setCurrentMessage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const messages = session.messages.sort((a, b) => a.order - b.order);

  const playMessage = (index: number) => {
    const message = messages[index];
    if (!message.audioUrl) return;

    if (currentAudio) {
      currentAudio.pause();
    }

    // Construct full URL for audio file
    const audioUrl = message.audioUrl.startsWith('http') 
      ? message.audioUrl 
      : `http://localhost:5100${message.audioUrl}`;
    
    const audio = new Audio(audioUrl);
    audio.playbackRate = playbackSpeed;
    
    audio.onended = () => {
      if (index < messages.length - 1) {
        playMessage(index + 1);
        setCurrentMessage(index + 1);
      } else {
        setIsPlaying(false);
        setCurrentMessage(0);
      }
    };

    audio.onerror = () => {
      console.error('Error playing audio for message:', message.id);
      if (index < messages.length - 1) {
        playMessage(index + 1);
        setCurrentMessage(index + 1);
      } else {
        setIsPlaying(false);
      }
    };

    setCurrentAudio(audio);
    audio.play();
  };

  const handlePlay = () => {
    if (isPlaying) {
      if (currentAudio) {
        currentAudio.pause();
      }
      setIsPlaying(false);
    } else {
      playMessage(currentMessage);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (currentAudio) {
      currentAudio.pause();
    }
    setIsPlaying(false);
    setCurrentMessage(0);
    setCurrentAudio(null);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (currentAudio) {
      currentAudio.playbackRate = speed;
    }
  };

  const exportTranscript = () => {
    const transcript = messages
      .map(m => `${m.participantName}: ${m.content}`)
      .join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.topic.replace(/[^a-z0-9]/gi, '_')}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: PodcastStatus) => {
    switch (status) {
      case PodcastStatus.Created: return 'text-gray-600';
      case PodcastStatus.InProgress: return 'text-yellow-600';
      case PodcastStatus.Completed: return 'text-green-600';
      case PodcastStatus.Failed: return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status: PodcastStatus) => {
    switch (status) {
      case PodcastStatus.Created: return 'Created';
      case PodcastStatus.InProgress: return 'In Progress';
      case PodcastStatus.Completed: return 'Completed';
      case PodcastStatus.Failed: return 'Failed';
      default: return 'Unknown';
    }
  };

  const hasAudio = messages.some(m => m.audioUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-semibold text-xl">{session.topic}</h2>
              <p className={`text-sm ${getStatusColor(session.status)}`}>
                Status: {getStatusText(session.status)}
              </p>
              <p className="text-gray-600 text-sm">
                Created: {new Date(session.createdAt).toLocaleString()}
              </p>
              {session.completedAt && (
                <p className="text-gray-600 text-sm">
                  Completed: {new Date(session.completedAt).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportTranscript}
                className="flex items-center gap-2 btn-secondary"
              >
                <Download className="w-4 h-4" />
                Export Transcript
              </button>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="mb-4">
          <h3 className="flex items-center gap-2 mb-2 font-medium">
            <Users className="w-4 h-4" />
            Participants
          </h3>
          <div className="flex flex-wrap gap-2">
            {session.participants.map((participant) => (
              <span
                key={participant.id}
                className={`px-3 py-1 rounded-full text-sm ${
                  participant.isHost
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <span className="font-medium">{participant.name}</span>
                {participant.isHost && <span className="ml-1">(Host)</span>}
                <span className="opacity-75 ml-1 text-xs">
                  • {participant.llmProviderName}
                </span>
                {participant.voiceName && (
                  <span className="ml-1">
                    <Volume2 className="inline w-3 h-3" />
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Audio Controls */}
        {hasAudio && (
          <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
            <button
              onClick={handlePlay}
              className="flex items-center gap-2 btn-primary"
            >
              {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={handleStop}
              className="flex items-center gap-2 btn-secondary"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>

            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-sm">Speed:</span>
              {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-2 py-1 text-sm rounded ${
                    playbackSpeed === speed
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>

            {isPlaying && (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <span>Playing:</span>
                <span className="font-medium">
                  {messages[currentMessage]?.participantName}
                </span>
                <span>({currentMessage + 1} of {messages.length})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-4">
        <h3 className="flex items-center gap-2 font-medium">
          <MessageSquare className="w-4 h-4" />
          Conversation ({messages.length} messages)
        </h3>
        
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`card ${
              isPlaying && index === currentMessage
                ? 'ring-2 ring-primary-500 bg-primary-50'
                : ''
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-primary-700">
                  {message.participantName}
                </span>
                {message.audioUrl && (
                  <Volume2 className="w-4 h-4 text-gray-400" />
                )}
                {!message.audioUrl && (
                  <VolumeX className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <span className="text-gray-500 text-xs">
                #{message.order}
              </span>
            </div>
            <p className="text-gray-800 leading-relaxed">{message.content}</p>
            {message.audioUrl && (
              <div className="mt-3 pt-3 border-gray-100 border-t">
                <audio controls className="w-full">
                  <source 
                    src={message.audioUrl.startsWith('http') 
                      ? message.audioUrl 
                      : `http://localhost:5100${message.audioUrl}`} 
                    type="audio/mpeg" 
                  />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="py-8 text-gray-500 text-center card">
            No messages in this podcast yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default PodcastPlayer;
