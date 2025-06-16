import { useState, useEffect } from 'react';
import { Settings, X } from 'lucide-react';
import { LLMProvider, LLMProviderType, CreateLLMProviderRequest } from '../types';
import { llmProviderService } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProvidersUpdate: () => void;
}

const SettingsModal = ({ isOpen, onClose, onProvidersUpdate }: SettingsModalProps) => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingProvider, setEditingProvider] = useState<LLMProvider | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<CreateLLMProviderRequest>({
    name: '',
    type: LLMProviderType.OpenAI,
    apiKey: '',
    endpoint: '',
    deploymentName: '',
    modelName: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadProviders();
    }
  }, [isOpen]);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const response = await llmProviderService.getAll();
      setProviders(response.data);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingProvider) {
        await llmProviderService.update(editingProvider.id, formData);
      } else {
        await llmProviderService.create(formData);
      }
      await loadProviders();
      onProvidersUpdate();
      setShowForm(false);
      setEditingProvider(null);
      resetForm();
    } catch (error) {
      console.error('Failed to save provider:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (provider: LLMProvider) => {
    setEditingProvider(provider);
    setFormData({
      name: provider.name,
      type: provider.type,
      apiKey: provider.apiKey || '',
      endpoint: provider.endpoint || '',
      deploymentName: provider.deploymentName || '',
      modelName: provider.modelName || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this provider?')) {
      try {
        setLoading(true);
        await llmProviderService.delete(id);
        await loadProviders();
        onProvidersUpdate();
      } catch (error) {
        console.error('Failed to delete provider:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: LLMProviderType.OpenAI,
      apiKey: '',
      endpoint: '',
      deploymentName: '',
      modelName: ''
    });
  };

  const getProviderTypeLabel = (type: LLMProviderType) => {
    switch (type) {
      case LLMProviderType.OpenAI: return 'OpenAI';
      case LLMProviderType.AzureOpenAI: return 'Azure OpenAI';
      case LLMProviderType.LMStudio: return 'LM Studio';
      case LLMProviderType.Ollama: return 'Ollama';
      default: return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white shadow-xl rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="flex items-center gap-2 font-semibold text-xl">
            <Settings className="w-5 h-5" />
            LLM Provider Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {!showForm ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg">Configured Providers</h3>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                  disabled={loading}
                >
                  Add Provider
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider) => (
                    <div key={provider.id} className="card">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium">{provider.name}</h4>
                          <p className="text-gray-600 text-sm">
                            Type: {getProviderTypeLabel(provider.type)}
                          </p>
                          {provider.modelName && (
                            <p className="text-gray-600 text-sm">
                              Model: {provider.modelName}
                            </p>
                          )}
                          {provider.endpoint && (
                            <p className="text-gray-600 text-sm">
                              Endpoint: {provider.endpoint}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(provider)}
                            className="text-sm btn-secondary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(provider.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-sm btn"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {providers.length === 0 && (
                    <div className="py-8 text-gray-500 text-center">
                      No providers configured. Add one to get started.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg">
                  {editingProvider ? 'Edit Provider' : 'Add Provider'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingProvider(null);
                    resetForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="label">Provider Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Provider Type</label>
                  <select
                    className="select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: parseInt(e.target.value) as LLMProviderType })}
                  >
                    <option value={LLMProviderType.OpenAI}>OpenAI</option>
                    <option value={LLMProviderType.AzureOpenAI}>Azure OpenAI</option>
                    <option value={LLMProviderType.LMStudio}>LM Studio</option>
                    <option value={LLMProviderType.Ollama}>Ollama</option>
                  </select>
                </div>

                {(formData.type === LLMProviderType.OpenAI || formData.type === LLMProviderType.AzureOpenAI) && (
                  <div className="form-group">
                    <label className="label">API Key</label>
                    <input
                      type="password"
                      className="input"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    />
                  </div>
                )}

                {(formData.type === LLMProviderType.AzureOpenAI || 
                  formData.type === LLMProviderType.LMStudio || 
                  formData.type === LLMProviderType.Ollama) && (
                  <div className="form-group">
                    <label className="label">Endpoint</label>
                    <input
                      type="url"
                      className="input"
                      value={formData.endpoint}
                      onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {formData.type === LLMProviderType.AzureOpenAI && (
                  <div className="form-group">
                    <label className="label">Deployment Name</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.deploymentName}
                      onChange={(e) => setFormData({ ...formData, deploymentName: e.target.value })}
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="label">Model Name</label>
                  <input
                    type="text"
                    className="input"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    placeholder="e.g., gpt-4, gpt-3.5-turbo, llama2"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Provider'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
