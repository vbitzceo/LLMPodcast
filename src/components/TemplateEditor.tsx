import React, { useState, useEffect } from 'react';
import { templateApi } from '../services/api';
import { PromptTemplate, TemplateValidationResult } from '../types';

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ isOpen, onClose }) => {
  const [templates, setTemplates] = useState<Record<string, PromptTemplate>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [currentTemplate, setCurrentTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [validation, setValidation] = useState<TemplateValidationResult | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [previewVariables, setPreviewVariables] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const templateNames = [
    { key: 'host_intro', label: 'Host Introduction' },
    { key: 'participant_response', label: 'Participant Response' },
    { key: 'host_response', label: 'Host Response' },
    { key: 'host_conclusion', label: 'Host Conclusion' }
  ];

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedTemplate && templates[selectedTemplate]) {
      setCurrentTemplate({ ...templates[selectedTemplate] });
      setIsEditing(false);
      setValidation(null);
      setPreview('');
      
      // Initialize preview variables based on template metadata
      const template = templates[selectedTemplate];
      const initialVariables: Record<string, string> = {};
      template.metadata.variables.forEach(variable => {
        initialVariables[variable] = getExampleValue(variable);
      });
      setPreviewVariables(initialVariables);
    }
  }, [selectedTemplate, templates]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const templatesData = await templateApi.getAllTemplates();
      setTemplates(templatesData);
      if (!selectedTemplate && Object.keys(templatesData).length > 0) {
        setSelectedTemplate(Object.keys(templatesData)[0]);
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExampleValue = (variable: string): string => {
    const examples: Record<string, string> = {
      topic: 'Artificial Intelligence in Healthcare',
      host_persona: 'A knowledgeable and engaging podcast host with expertise in technology',
      participant_persona: 'A data scientist with 10 years of experience in AI/ML',
      participant_names: 'Dr. Sarah Johnson and Prof. Michael Chen',
      context: 'Previous discussion about machine learning applications in medical diagnosis...'
    };
    return examples[variable] || `[${variable}]`;
  };

  const handleSave = async () => {
    if (!currentTemplate || !selectedTemplate) return;
    
    setSaving(true);
    try {
      await templateApi.updateTemplate(selectedTemplate, currentTemplate);
      await loadTemplates(); // Reload to get latest data
      setIsEditing(false);
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async () => {
    if (!currentTemplate) return;
    
    try {
      const result = await templateApi.validateTemplate(currentTemplate);
      setValidation(result);
    } catch (error) {
      console.error('Failed to validate template:', error);
    }
  };

  const handlePreview = async () => {
    if (!selectedTemplate) return;
    
    try {
      const result = await templateApi.previewTemplate(selectedTemplate, previewVariables);
      setPreview(result);
    } catch (error) {
      console.error('Failed to preview template:', error);
    }
  };

  const updateTemplate = (field: keyof PromptTemplate, value: any) => {
    if (!currentTemplate) return;
    
    setCurrentTemplate({
      ...currentTemplate,
      [field]: value
    });
    setIsEditing(true);
  };

  const updateExecutionSettings = (field: string, value: any) => {
    if (!currentTemplate) return;
    
    setCurrentTemplate({
      ...currentTemplate,
      execution_settings: {
        ...currentTemplate.execution_settings,
        [field]: value
      }
    });
    setIsEditing(true);
  };

  const updateMetadata = (field: string, value: any) => {
    if (!currentTemplate) return;
    
    setCurrentTemplate({
      ...currentTemplate,
      metadata: {
        ...currentTemplate.metadata,
        [field]: value
      }
    });
    setIsEditing(true);
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white shadow-xl rounded-lg w-full max-w-6xl h-5/6 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="bg-gray-50 p-4 border-gray-200 border-r w-1/4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Templates</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {loading ? (
              <div className="py-4 text-center">Loading...</div>
            ) : (
              <div className="space-y-2">
                {templateNames.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedTemplate(key)}
                    className={`w-full text-left p-3 rounded-md transition-colors ${
                      selectedTemplate === key
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-gray-500 text-sm">{key}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex flex-col flex-1">
            {currentTemplate && (
              <>
                {/* Header */}
                <div className="p-4 border-gray-200 border-b">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-xl">{currentTemplate.metadata.name}</h3>
                      <p className="text-gray-600">{currentTemplate.metadata.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleValidate}
                        className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-md text-white"
                      >
                        Validate
                      </button>
                      <button
                        onClick={handlePreview}
                        className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-md text-white"
                      >
                        Preview
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={!isEditing || saving}
                        className={`px-4 py-2 rounded-md ${
                          isEditing && !saving
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                  <div className="grid grid-cols-2 h-full">
                    {/* Left Panel - Editor */}
                    <div className="p-4 border-gray-200 border-r overflow-y-auto">
                      <div className="space-y-6">
                        {/* Template Content */}
                        <div>
                          <label className="block mb-2 font-medium text-gray-700 text-sm">
                            Template Content
                          </label>
                          <textarea
                            value={currentTemplate.template}
                            onChange={(e) => updateTemplate('template', e.target.value)}
                            className="p-3 border border-gray-300 rounded-md w-full h-40 font-mono text-sm"
                            placeholder="Enter your Handlebars template here..."
                          />
                        </div>

                        {/* Execution Settings */}
                        <div>
                          <h4 className="mb-3 font-medium text-gray-700 text-sm">Execution Settings</h4>
                          <div className="gap-4 grid grid-cols-2">
                            <div>
                              <label className="block mb-1 text-gray-600 text-xs">Max Tokens</label>
                              <input
                                type="number"
                                value={currentTemplate.execution_settings.max_tokens}
                                onChange={(e) => updateExecutionSettings('max_tokens', parseInt(e.target.value))}
                                className="p-2 border border-gray-300 rounded w-full text-sm"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-gray-600 text-xs">Temperature</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="2"
                                value={currentTemplate.execution_settings.temperature}
                                onChange={(e) => updateExecutionSettings('temperature', parseFloat(e.target.value))}
                                className="p-2 border border-gray-300 rounded w-full text-sm"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-gray-600 text-xs">Top P</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                value={currentTemplate.execution_settings.top_p || ''}
                                onChange={(e) => updateExecutionSettings('top_p', e.target.value ? parseFloat(e.target.value) : null)}
                                className="p-2 border border-gray-300 rounded w-full text-sm"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-gray-600 text-xs">Frequency Penalty</label>
                              <input
                                type="number"
                                step="0.1"
                                min="-2"
                                max="2"
                                value={currentTemplate.execution_settings.frequency_penalty}
                                onChange={(e) => updateExecutionSettings('frequency_penalty', parseFloat(e.target.value))}
                                className="p-2 border border-gray-300 rounded w-full text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Metadata */}
                        <div>
                          <h4 className="mb-3 font-medium text-gray-700 text-sm">Metadata</h4>
                          <div className="space-y-3">
                            <div>
                              <label className="block mb-1 text-gray-600 text-xs">Name</label>
                              <input
                                type="text"
                                value={currentTemplate.metadata.name}
                                onChange={(e) => updateMetadata('name', e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full text-sm"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-gray-600 text-xs">Description</label>
                              <textarea
                                value={currentTemplate.metadata.description}
                                onChange={(e) => updateMetadata('description', e.target.value)}
                                className="p-2 border border-gray-300 rounded w-full h-20 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block mb-1 text-gray-600 text-xs">Variables (comma-separated)</label>
                              <input
                                type="text"
                                value={currentTemplate.metadata.variables.join(', ')}
                                onChange={(e) => updateMetadata('variables', e.target.value.split(',').map(v => v.trim()).filter(Boolean))}
                                className="p-2 border border-gray-300 rounded w-full text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel - Preview & Validation */}
                    <div className="p-4 overflow-y-auto">
                      <div className="space-y-6">
                        {/* Validation Results */}
                        {validation && (
                          <div>
                            <h4 className="mb-3 font-medium text-gray-700 text-sm">Validation Results</h4>
                            <div className={`p-3 rounded-md ${validation.isValid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                              <div className="flex items-center mb-2">
                                {validation.isValid ? (
                                  <span className="text-green-600">✓ Valid</span>
                                ) : (
                                  <span className="text-red-600">✗ Invalid</span>
                                )}
                              </div>
                              
                              {validation.errors.length > 0 && (
                                <div className="mb-2">
                                  <div className="font-medium text-red-700 text-sm">Errors:</div>
                                  <ul className="text-red-600 text-sm list-disc list-inside">
                                    {validation.errors.map((error, i) => (
                                      <li key={i}>{error}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {validation.warnings.length > 0 && (
                                <div>
                                  <div className="font-medium text-yellow-700 text-sm">Warnings:</div>
                                  <ul className="text-yellow-600 text-sm list-disc list-inside">
                                    {validation.warnings.map((warning, i) => (
                                      <li key={i}>{warning}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Preview Variables */}
                        <div>
                          <h4 className="mb-3 font-medium text-gray-700 text-sm">Preview Variables</h4>
                          <div className="space-y-2">
                            {currentTemplate.metadata.variables.map(variable => (
                              <div key={variable}>
                                <label className="block mb-1 text-gray-600 text-xs">{variable}</label>
                                <input
                                  type="text"
                                  value={previewVariables[variable] || ''}
                                  onChange={(e) => setPreviewVariables({
                                    ...previewVariables,
                                    [variable]: e.target.value
                                  })}
                                  className="p-2 border border-gray-300 rounded w-full text-sm"
                                  placeholder={`Enter ${variable}...`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Preview Result */}
                        {preview && (
                          <div>
                            <h4 className="mb-3 font-medium text-gray-700 text-sm">Preview Result</h4>
                            <div className="bg-gray-50 p-3 border border-gray-200 rounded-md">
                              <pre className="text-sm whitespace-pre-wrap">{preview}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;
