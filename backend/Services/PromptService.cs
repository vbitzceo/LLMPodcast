using YamlDotNet.Serialization;
using YamlDotNet.Serialization.NamingConventions;
using HandlebarsDotNet;
using LLMPodcastAPI.Models;

namespace LLMPodcastAPI.Services;

public interface IPromptService
{
    string GetHostIntroPrompt(string topic, string hostPersona, string participantNames);
    string GetParticipantResponsePrompt(string topic, string participantPersona, string context);
    string GetHostResponsePrompt(string topic, string hostPersona, string context);
    string GetHostConclusionPrompt(string topic, string hostPersona, string context);
    ExecutionSettings? GetExecutionSettings(string templateName);
    PromptTemplate? GetPromptTemplate(string templateName);
    Dictionary<string, PromptMetadata> GetAllPromptMetadata();
    Task<bool> UpdateTemplateAsync(string templateName, PromptTemplate template);
    string PreviewTemplate(string templateContent, Dictionary<string, string> variables);
    TemplateValidationResult ValidateTemplate(PromptTemplate template);
}

public class PromptService : IPromptService
{
    private readonly Dictionary<string, HandlebarsTemplate<object, object>> _compiledTemplates;
    private readonly Dictionary<string, PromptTemplate> _promptTemplates;
    private readonly ILogger<PromptService> _logger;

    public PromptService(ILogger<PromptService> logger)
    {
        _logger = logger;
        _promptTemplates = LoadPromptTemplates();
        _compiledTemplates = CompileTemplates(_promptTemplates);
    }

    private Dictionary<string, PromptTemplate> LoadPromptTemplates()
    {
        var templates = new Dictionary<string, PromptTemplate>();
        var promptsDirectory = Path.Combine(Directory.GetCurrentDirectory(), "prompts");
        
        if (!Directory.Exists(promptsDirectory))
        {
            _logger.LogWarning("Prompts directory not found at {PromptsDirectory}. Using default prompts.", promptsDirectory);
            return GetDefaultPromptTemplates();
        }

        var promptFiles = new[]
        {
            "host_intro.yml",
            "participant_response.yml", 
            "host_response.yml",
            "host_conclusion.yml"
        };

        var deserializer = new DeserializerBuilder()
            .WithNamingConvention(UnderscoredNamingConvention.Instance)
            .Build();

        foreach (var fileName in promptFiles)
        {
            try
            {
                var filePath = Path.Combine(promptsDirectory, fileName);
                if (File.Exists(filePath))
                {
                    var yamlContent = File.ReadAllText(filePath);
                    var promptTemplate = deserializer.Deserialize<PromptTemplate>(yamlContent);
                    var key = Path.GetFileNameWithoutExtension(fileName);
                    templates[key] = promptTemplate;
                    _logger.LogInformation("Loaded prompt template: {FileName}", fileName);
                }
                else
                {
                    _logger.LogWarning("Prompt file not found: {FileName}", fileName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to load prompt template: {FileName}", fileName);
            }
        }

        // Fill in any missing templates with defaults
        var defaultTemplates = GetDefaultPromptTemplates();
        foreach (var kvp in defaultTemplates)
        {
            if (!templates.ContainsKey(kvp.Key))
            {
                templates[kvp.Key] = kvp.Value;
                _logger.LogInformation("Using default template for: {Key}", kvp.Key);
            }
        }

        return templates;
    }

    private Dictionary<string, HandlebarsTemplate<object, object>> CompileTemplates(Dictionary<string, PromptTemplate> promptTemplates)
    {
        var compiledTemplates = new Dictionary<string, HandlebarsTemplate<object, object>>();

        foreach (var kvp in promptTemplates)
        {
            try
            {
                var compiledTemplate = Handlebars.Compile(kvp.Value.Template);
                compiledTemplates[kvp.Key] = compiledTemplate;
                _logger.LogDebug("Compiled template: {Key}", kvp.Key);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to compile template: {Key}", kvp.Key);
            }
        }

        return compiledTemplates;
    }

    private Dictionary<string, PromptTemplate> GetDefaultPromptTemplates()
    {
        return new Dictionary<string, PromptTemplate>
        {
            ["host_intro"] = new PromptTemplate
            {
                Template = "You are the host of a podcast about '{{topic}}'. Your persona: {{host_persona}}. The other participants in today's discussion are: {{participant_names}}. Introduce the topic and welcome the other participants by name. Keep it brief and engaging. Respond naturally as if speaking in a conversation - do not include your name or labels.",
                Metadata = new PromptMetadata
                {
                    Name = "Host Introduction (Default)",
                    Description = "Default template for podcast host introduction",
                    Version = "1.0",
                    Variables = new List<string> { "topic", "host_persona", "participant_names" }
                }
            },
            ["participant_response"] = new PromptTemplate
            {
                Template = "You are participating in a podcast discussion about '{{topic}}'.\n\nYour persona: {{participant_persona}}\n\nRecent conversation:\n{{context}}\n\nRespond naturally to continue the discussion. Share your perspective on the topic. Speak directly as if in conversation - do not include your name, labels, or prefixes like 'Me:', 'I think', etc. Just provide your natural response to what has been discussed.",
                Metadata = new PromptMetadata
                {
                    Name = "Participant Response (Default)",
                    Description = "Default template for participant responses",
                    Version = "1.0",
                    Variables = new List<string> { "topic", "participant_persona", "context" }
                }
            },
            ["host_response"] = new PromptTemplate
            {
                Template = "You are the host of a podcast about '{{topic}}'.\n\nYour persona: {{host_persona}}\n\nRecent conversation:\n{{context}}\n\nAs the host, respond to what has been discussed and guide the conversation forward. Ask follow-up questions or introduce new angles. Speak naturally as if in conversation - do not include your name or labels.",
                Metadata = new PromptMetadata
                {
                    Name = "Host Response (Default)", 
                    Description = "Default template for host responses during conversation",
                    Version = "1.0",
                    Variables = new List<string> { "topic", "host_persona", "context" }
                }
            },
            ["host_conclusion"] = new PromptTemplate
            {
                Template = "You are concluding a podcast discussion about '{{topic}}'.\n\nYour persona: {{host_persona}}\n\nThe discussion covered:\n{{context}}\n\nAs the host, provide a brief, engaging conclusion to wrap up this podcast episode. Thank the participants and summarize key insights. Speak directly as if in conversation - do not include your name or labels.",
                Metadata = new PromptMetadata
                {
                    Name = "Host Conclusion (Default)",
                    Description = "Default template for podcast conclusion",
                    Version = "1.0", 
                    Variables = new List<string> { "topic", "host_persona", "context" }
                }
            }
        };
    }

    public string GetHostIntroPrompt(string topic, string hostPersona, string participantNames)
    {
        var template = _compiledTemplates["host_intro"];
        var context = new
        {
            topic = topic,
            host_persona = hostPersona,
            participant_names = participantNames
        };
        return template(context);
    }

    public string GetParticipantResponsePrompt(string topic, string participantPersona, string context)
    {
        var template = _compiledTemplates["participant_response"];
        var templateContext = new
        {
            topic = topic,
            participant_persona = participantPersona,
            context = context
        };
        return template(templateContext);
    }

    public string GetHostResponsePrompt(string topic, string hostPersona, string context)
    {
        var template = _compiledTemplates["host_response"];
        var templateContext = new
        {
            topic = topic,
            host_persona = hostPersona,
            context = context
        };
        return template(templateContext);
    }

    public string GetHostConclusionPrompt(string topic, string hostPersona, string context)
    {
        var template = _compiledTemplates["host_conclusion"];
        var templateContext = new
        {
            topic = topic,
            host_persona = hostPersona,
            context = context
        };
        return template(templateContext);
    }

    public PromptTemplate? GetPromptTemplate(string templateName)
    {
        return _promptTemplates.TryGetValue(templateName, out var template) ? template : null;
    }

    public Dictionary<string, PromptMetadata> GetAllPromptMetadata()
    {
        return _promptTemplates.ToDictionary(
            kvp => kvp.Key,
            kvp => kvp.Value.Metadata
        );
    }

    public ExecutionSettings? GetExecutionSettings(string templateName)
    {
        return _promptTemplates.TryGetValue(templateName, out var template) 
            ? template.ExecutionSettings 
            : null;
    }

    public async Task<bool> UpdateTemplateAsync(string templateName, PromptTemplate template)
    {
        try
        {
            var yamlPath = Path.Combine(Directory.GetCurrentDirectory(), "prompts", $"{templateName}.yml");
            
            var serializer = new SerializerBuilder()
                .WithNamingConvention(YamlDotNet.Serialization.NamingConventions.UnderscoredNamingConvention.Instance)
                .Build();
            
            var yamlContent = serializer.Serialize(template);
            await File.WriteAllTextAsync(yamlPath, yamlContent);
            
            // Reload the template
            var deserializer = new DeserializerBuilder()
                .WithNamingConvention(YamlDotNet.Serialization.NamingConventions.UnderscoredNamingConvention.Instance)
                .Build();
            
            var reloadedTemplate = deserializer.Deserialize<PromptTemplate>(yamlContent);
            _promptTemplates[templateName] = reloadedTemplate;
            
            // Recompile the template
            var compiledTemplate = Handlebars.Compile(reloadedTemplate.Template);
            _compiledTemplates[templateName] = compiledTemplate;
            
            _logger.LogInformation("Updated template: {TemplateName}", templateName);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to update template: {TemplateName}", templateName);
            return false;
        }
    }

    public string PreviewTemplate(string templateContent, Dictionary<string, string> variables)
    {
        try
        {
            var template = Handlebars.Compile(templateContent);
            return template(variables);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to preview template");
            return $"Error previewing template: {ex.Message}";
        }
    }

    public TemplateValidationResult ValidateTemplate(PromptTemplate template)
    {
        var result = new TemplateValidationResult();
        
        try
        {
            // Test compilation
            var compiledTemplate = Handlebars.Compile(template.Template);
            
            // Extract variables from template
            var variablePattern = @"\{\{([^}]+)\}\}";
            var matches = System.Text.RegularExpressions.Regex.Matches(template.Template, variablePattern);
            var detectedVariables = matches.Cast<System.Text.RegularExpressions.Match>()
                .Select(m => m.Groups[1].Value.Trim())
                .Distinct()
                .ToList();
            
            result.DetectedVariables = detectedVariables;
            
            // Check if metadata variables match detected variables
            var metadataVariables = template.Metadata.Variables ?? new List<string>();
            var missingFromMetadata = detectedVariables.Except(metadataVariables).ToList();
            var extraInMetadata = metadataVariables.Except(detectedVariables).ToList();
            
            if (missingFromMetadata.Any())
            {
                result.Warnings.Add($"Variables found in template but not in metadata: {string.Join(", ", missingFromMetadata)}");
            }
            
            if (extraInMetadata.Any())
            {
                result.Warnings.Add($"Variables in metadata but not found in template: {string.Join(", ", extraInMetadata)}");
            }
            
            // Validate execution settings
            if (template.ExecutionSettings != null)
            {
                if (template.ExecutionSettings.MaxTokens <= 0)
                {
                    result.Errors.Add("MaxTokens must be greater than 0");
                }
                
                if (template.ExecutionSettings.Temperature < 0 || template.ExecutionSettings.Temperature > 2)
                {
                    result.Warnings.Add("Temperature should typically be between 0 and 2");
                }
            }
            
            // Check template content
            if (string.IsNullOrWhiteSpace(template.Template))
            {
                result.Errors.Add("Template content cannot be empty");
            }
            
            result.IsValid = !result.Errors.Any();
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Template compilation error: {ex.Message}");
            result.IsValid = false;
        }
        
        return result;
    }
}
