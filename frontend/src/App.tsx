import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Mic, Users, Play, RefreshCw, Copy } from 'lucide-react';
import { 
  LLMProvider, 
  VoiceOption, 
  CreatePodcastRequest, 
  PodcastSession,
  PodcastStatus
} from './types';
import { llmProviderService, speechService, podcastService } from './services/api';
import SettingsModal from './components/SettingsModal';
import PodcastPlayer from './components/PodcastPlayer';

interface ParticipantForm {
  name: string;
  persona: string;
  llmProviderId: number;
  voiceName?: string;
  isHost: boolean;
}

function App() {
  const [topic, setTopic] = useState('');
  const [participants, setParticipants] = useState<ParticipantForm[]>([]);
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPodcast, setCurrentPodcast] = useState<PodcastSession | null>(null);
  const [recentPodcasts, setRecentPodcasts] = useState<PodcastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedFromPodcast, setCopiedFromPodcast] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [providersRes, voicesRes, podcastsRes] = await Promise.all([
        llmProviderService.getAll(),
        speechService.getVoices(),
        podcastService.getAll()
      ]);
      
      setProviders(providersRes.data);
      setVoices(voicesRes.data);
      setRecentPodcasts(podcastsRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addParticipant = () => {
    setParticipants([
      ...participants,
      { 
        name: '', 
        persona: '', 
        llmProviderId: providers[0]?.id || 1, 
        isHost: false 
      }
    ]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: keyof ParticipantForm, value: string | number | boolean) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    
    // Ensure only one host
    if (field === 'isHost' && value === true) {
      updated.forEach((p, i) => {
        if (i !== index) p.isHost = false;
      });
    }
    
    setParticipants(updated);
  };

  const validateForm = () => {
    if (!topic.trim()) {
      alert('Please enter a topic for the podcast.');
      return false;
    }
    
    if (participants.length === 0) {
      alert('Please add at least one participant.');
      return false;
    }
    
    for (const participant of participants) {
      if (!participant.name.trim()) {
        alert('Please enter a name for all participants.');
        return false;
      }
      if (!participant.persona.trim()) {
        alert('Please enter a persona for all participants.');
        return false;
      }
    }
    
    const hasHost = participants.some(p => p.isHost);
    if (!hasHost) {
      participants[0].isHost = true;
    }
    
    return true;
  };

  const createPodcast = async () => {
    if (!validateForm()) return;
    
    try {
      setIsGenerating(true);
      
      const request: CreatePodcastRequest = {
        topic: topic.trim(),
        participants: participants.map(p => ({
          name: p.name.trim(),
          persona: p.persona.trim(),
          llmProviderId: p.llmProviderId,
          voiceName: p.voiceName,
          isHost: p.isHost
        }))
      };
      
      const response = await podcastService.create(request);
      const session = response.data;
      
      // Generate the podcast content
      const generatedResponse = await podcastService.generate(session.id);
      setCurrentPodcast(generatedResponse.data);
      
      // Refresh recent podcasts
      const podcastsRes = await podcastService.getAll();
      setRecentPodcasts(podcastsRes.data);
      
    } catch (error) {
      console.error('Failed to create podcast:', error);
      alert('Failed to create podcast. Please check your LLM provider settings and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadPodcast = async (id: number) => {
    try {
      const response = await podcastService.getById(id);
      setCurrentPodcast(response.data);
    } catch (error) {
      console.error('Failed to load podcast:', error);
    }
  };

  const clearForm = () => {
    setTopic('');
    setParticipants([]);
    setCopiedFromPodcast(null);
  };

  const copySettingsFromPodcast = async (podcastId: number) => {
    try {
      const response = await podcastService.getById(podcastId);
      const sourcePodcast = response.data;
      
      // Convert participants from the source podcast to the form format
      const copiedParticipants: ParticipantForm[] = sourcePodcast.participants.map(p => {
        // Find the matching provider by name since the response includes provider name, not ID
        const matchingProvider = providers.find(provider => provider.name === p.llmProviderName);
        
        return {
          name: p.name,
          persona: p.persona,
          llmProviderId: matchingProvider?.id || providers[0]?.id || 1,
          voiceName: p.voiceName,
          isHost: p.isHost
        };
      });
      
      setParticipants(copiedParticipants);
      setCopiedFromPodcast(sourcePodcast.topic);
      
      // Clear any existing topic to encourage user to enter a new one
      setTopic('');
      
      // Show a notification
      setTimeout(() => setCopiedFromPodcast(null), 3000);
      
    } catch (error) {
      console.error('Failed to copy podcast settings:', error);
      alert('Failed to copy podcast settings. Please try again.');
    }
  };

  const getStatusColor = (status: PodcastStatus) => {
    switch (status) {
      case PodcastStatus.Created: return 'bg-gray-100 text-gray-800';
      case PodcastStatus.InProgress: return 'bg-yellow-100 text-yellow-800';
      case PodcastStatus.Completed: return 'bg-green-100 text-green-800';
      case PodcastStatus.Failed: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-gray-50 min-h-screen">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 w-8 h-8 text-primary-600 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="flex items-center gap-3 font-bold text-gray-900 text-3xl">
              <Mic className="w-8 h-8 text-primary-600" />
              LLM Podcast Generator
            </h1>
            <p className="mt-2 text-gray-600">
              Create AI-powered podcast conversations on any topic
            </p>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 btn-secondary"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>

        <div className="gap-8 grid grid-cols-1 lg:grid-cols-3">
          {/* Main Form */}
          <div className="space-y-6 lg:col-span-2">
            {!currentPodcast ? (
              <>
                {/* Copied Settings Notification */}
                {copiedFromPodcast && (
                  <div className="bg-green-50 border-l-4 border-l-green-500 card">
                    <div className="flex items-center gap-2 text-green-800">
                      <Copy className="w-4 h-4" />
                      <span className="font-medium">Settings copied from:</span>
                      <span className="text-green-600">"{copiedFromPodcast}"</span>
                    </div>
                    <p className="mt-1 text-green-700 text-sm">
                      All participant settings have been copied. Enter a new topic to create your podcast.
                    </p>
                  </div>
                )}

                {/* Topic Input */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="font-semibold text-xl">Podcast Topic</h2>
                  </div>
                  <div className="form-group">
                    <label className="label">What would you like the podcast to discuss?</label>
                    <textarea
                      className="textarea"
                      rows={3}
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., The future of artificial intelligence in healthcare, The impact of remote work on productivity, etc."
                    />
                  </div>
                </div>

                {/* Participants */}
                <div className="card">
                  <div className="card-header">
                    <div className="flex justify-between items-center">
                      <h2 className="flex items-center gap-2 font-semibold text-xl">
                        <Users className="w-5 h-5" />
                        Participants ({participants.length})
                      </h2>
                      <div className="flex gap-2">
                        {(participants.length > 0 || copiedFromPodcast) && (
                          <button
                            onClick={clearForm}
                            className="flex items-center gap-2 hover:bg-red-50 px-3 py-1 rounded text-gray-600 hover:text-red-600 text-sm transition-colors"
                            title="Clear all participants and topic"
                          >
                            <Trash2 className="w-3 h-3" />
                            Clear Form
                          </button>
                        )}
                        {participants.length < 4 && (
                          <button
                            onClick={addParticipant}
                            className="flex items-center gap-2 btn-secondary"
                          >
                            <Plus className="w-4 h-4" />
                            Add Participant
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {participants.map((participant, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-medium">
                            Participant {index + 1}
                            {participant.isHost && (
                              <span className="bg-primary-100 ml-2 px-2 py-1 rounded-full text-primary-800 text-xs">
                                Host
                              </span>
                            )}
                          </h3>
                          {participants.length > 1 && (
                            <button
                              onClick={() => removeParticipant(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                          <div className="form-group">
                            <label className="label">Name</label>
                            <input
                              type="text"
                              className="input"
                              value={participant.name}
                              onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                              placeholder="e.g., Alex, Jordan, Sam"
                            />
                          </div>

                          <div className="form-group">
                            <label className="label">LLM Provider</label>
                            <select
                              className="select"
                              value={participant.llmProviderId}
                              onChange={(e) => updateParticipant(index, 'llmProviderId', parseInt(e.target.value))}
                            >
                              {providers.map(provider => (
                                <option key={provider.id} value={provider.id}>
                                  {provider.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group md:col-span-2">
                            <label className="label">Persona</label>
                            <textarea
                              className="textarea"
                              rows={3}
                              value={participant.persona}
                              onChange={(e) => updateParticipant(index, 'persona', e.target.value)}
                              placeholder="Describe this participant's personality, expertise, and speaking style..."
                            />
                          </div>

                          <div className="form-group">
                            <label className="label">Voice (Optional)</label>
                            <select
                              className="select"
                              value={participant.voiceName || ''}
                              onChange={(e) => updateParticipant(index, 'voiceName', e.target.value)}
                            >
                              <option value="">No voice (text only)</option>
                              {voices.map(voice => (
                                <option key={voice.name} value={voice.name}>
                                  {voice.displayName}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={participant.isHost}
                                onChange={(e) => updateParticipant(index, 'isHost', e.target.checked)}
                                className="border-gray-300 rounded focus:ring-primary-500 text-primary-600"
                              />
                              Is Host
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={createPodcast}
                      disabled={isGenerating || providers.length === 0}
                      className="flex justify-center items-center gap-2 w-full btn-primary"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Generating Podcast...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Generate Podcast
                        </>
                      )}
                    </button>
                    {providers.length === 0 && (
                      <p className="mt-2 text-red-600 text-sm">
                        Please configure at least one LLM provider in settings before generating a podcast.
                      </p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setCurrentPodcast(null)}
                    className="btn-secondary"
                  >
                    ← Back to Create New
                  </button>
                  <button
                    onClick={() => copySettingsFromPodcast(currentPodcast.id)}
                    className="flex items-center gap-2 btn-secondary"
                    title="Copy these settings to create a new podcast"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Settings
                  </button>
                </div>
                <PodcastPlayer session={currentPodcast} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Recent Podcasts</h3>
              </div>
              <div className="space-y-3">
                {recentPodcasts.slice(0, 5).map((podcast) => (
                  <div
                    key={podcast.id}
                    className="p-3 border border-gray-200 rounded-lg"
                  >
                    <div 
                      className="hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => loadPodcast(podcast.id)}
                    >
                      <h4 className="font-medium text-sm truncate">{podcast.topic}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(podcast.status)}`}>
                          {getStatusText(podcast.status)}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {new Date(podcast.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Copy Settings Button */}
                    <div className="flex justify-end mt-2 pt-2 border-gray-100 border-t">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copySettingsFromPodcast(podcast.id);
                        }}
                        className="flex items-center gap-1 hover:bg-primary-50 px-2 py-1 rounded text-gray-600 hover:text-primary-600 text-xs transition-colors"
                        title="Copy participant settings to create a new podcast"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Settings
                      </button>
                    </div>
                  </div>
                ))}
                {recentPodcasts.length === 0 && (
                  <p className="py-4 text-gray-500 text-sm text-center">
                    No podcasts created yet
                  </p>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold">Tips</h3>
              </div>
              <div className="space-y-3 text-gray-600 text-sm">
                <div>
                  <strong>Topic:</strong> Be specific and interesting. Good topics generate better conversations.
                </div>
                <div>
                  <strong>Personas:</strong> Give each participant a unique personality and expertise area.
                </div>
                <div>
                  <strong>Host:</strong> The host introduces the topic and guides the conversation.
                </div>
                <div>
                  <strong>Copy Settings:</strong> Use "Copy Settings" from recent podcasts to reuse participant configurations.
                </div>
                <div>
                  <strong>Voices:</strong> Configure Azure Speech Service in settings for text-to-speech.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onProvidersUpdate={loadInitialData}
      />
    </div>
  );
}

export default App;
