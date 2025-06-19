import { useState, useEffect } from 'react';
import { Trash2, Play, Calendar, Users, Hash, ArrowLeft } from 'lucide-react';
import { PodcastSession, PodcastStatus } from '../types';
import { podcastService } from '../services/api';

interface PodcastLibraryProps {
  onBack: () => void;
  onPodcastSelect: (podcast: PodcastSession) => void;
}

function PodcastLibrary({ onBack, onPodcastSelect }: PodcastLibraryProps) {
  const [podcasts, setPodcasts] = useState<PodcastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    loadPodcasts();
  }, []);

  const loadPodcasts = async () => {
    try {
      setLoading(true);
      const response = await podcastService.getAll();
      setPodcasts(response.data);
    } catch (error) {
      console.error('Failed to load podcasts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayPodcast = async (podcastId: number) => {
    try {
      const response = await podcastService.getById(podcastId);
      onPodcastSelect(response.data);
    } catch (error) {
      console.error('Failed to load podcast:', error);
      alert('Failed to load podcast. Please try again.');
    }
  };

  const deletePodcast = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will permanently remove the podcast and all its audio files.`)) {
      return;
    }

    try {
      setDeleting(id);
      await podcastService.delete(id);
      setPodcasts(podcasts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete podcast:', error);
      alert('Failed to delete podcast. Please try again.');
    } finally {
      setDeleting(null);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 border-4 border-primary-600 border-t-transparent rounded-full w-8 h-8 animate-spin"></div>
          <p className="text-gray-600">Loading podcasts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 btn-secondary"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div>
          <h1 className="font-bold text-gray-900 text-2xl">Podcast Library</h1>
          <p className="text-gray-600">Manage your podcast collection</p>
        </div>
      </div>

      {/* Stats */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
        <div className="card">
          <div className="text-center">
            <div className="font-bold text-primary-600 text-2xl">{podcasts.length}</div>
            <div className="text-gray-600 text-sm">Total Podcasts</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="font-bold text-green-600 text-2xl">
              {podcasts.filter(p => p.status === PodcastStatus.Completed).length}
            </div>
            <div className="text-gray-600 text-sm">Completed</div>
          </div>
        </div>
        <div className="card">
          <div className="text-center">
            <div className="font-bold text-gray-600 text-2xl">
              {podcasts.reduce((total, p) => total + p.messages.length, 0)}
            </div>
            <div className="text-gray-600 text-sm">Total Messages</div>
          </div>
        </div>
      </div>

      {/* Podcast List */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-xl">All Podcasts</h2>
        </div>
        
        {podcasts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mb-4 text-gray-400 text-6xl">🎙️</div>
            <h3 className="mb-2 font-medium text-gray-900">No podcasts yet</h3>
            <p className="text-gray-600">Create your first podcast to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {podcasts.map((podcast) => (
              <div
                key={podcast.id}
                className="hover:bg-gray-50 p-4 border border-gray-200 rounded-lg transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {podcast.topic}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(podcast.createdAt)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {podcast.participants.length} participants
                      </div>
                      <div className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        {podcast.rounds} rounds
                      </div>
                      <div className="flex items-center gap-1">
                        💬 {podcast.messages.length} messages
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(podcast.status)}`}>
                        {getStatusText(podcast.status)}
                      </span>
                      {podcast.participants.map(p => (
                        <span key={p.id} className="bg-gray-100 px-2 py-1 rounded text-gray-700 text-xs">
                          {p.name}
                          {p.isHost && ' (Host)'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {podcast.status === PodcastStatus.Completed && (
                      <button
                        onClick={() => handlePlayPodcast(podcast.id)}
                        className="flex items-center gap-1 hover:bg-primary-50 px-3 py-2 rounded text-primary-600 hover:text-primary-700 text-sm transition-colors"
                        title="Play podcast"
                      >
                        <Play className="w-4 h-4" />
                        Play
                      </button>
                    )}
                    
                    <button
                      onClick={() => deletePodcast(podcast.id, podcast.topic)}
                      disabled={deleting === podcast.id}
                      className="flex items-center gap-1 hover:bg-red-50 disabled:opacity-50 px-3 py-2 rounded text-red-600 hover:text-red-700 text-sm transition-colors"
                      title="Delete podcast"
                    >
                      {deleting === podcast.id ? (
                        <div className="border-2 border-t-transparent border-red-600 rounded-full w-4 h-4 animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PodcastLibrary;
