using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using LLMPodcastAPI.Models;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace LLMPodcastAPI.Services;

public interface ILLMProviderService
{
    Task<string> GenerateResponseAsync(LLMProvider provider, string prompt, string persona);
    Task<string> GenerateResponseAsync(LLMProvider provider, string prompt, string persona, ExecutionSettings? settings);
}

public class LLMProviderService : ILLMProviderService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<LLMProviderService> _logger;

    public LLMProviderService(IHttpClientFactory httpClientFactory, ILogger<LLMProviderService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<string> GenerateResponseAsync(LLMProvider provider, string prompt, string persona)
    {
        try
        {
            return provider.Type switch
            {
                LLMProviderType.OpenAI => await GenerateOpenAIResponseAsync(provider, prompt, persona),
                LLMProviderType.AzureOpenAI => await GenerateAzureOpenAIResponseAsync(provider, prompt, persona),
                LLMProviderType.LMStudio => await GenerateLMStudioResponseAsync(provider, prompt, persona),
                LLMProviderType.Ollama => await GenerateOllamaResponseAsync(provider, prompt, persona),
                _ => throw new NotSupportedException($"Provider type {provider.Type} is not supported")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating response from {ProviderType} provider {ProviderName}", 
                provider.Type, provider.Name);
            return "I apologize, but I'm having trouble generating a response right now.";
        }
    }

    public async Task<string> GenerateResponseAsync(LLMProvider provider, string prompt, string persona, ExecutionSettings? settings)
    {
        try
        {
            return provider.Type switch
            {
                LLMProviderType.OpenAI => await GenerateOpenAIResponseAsync(provider, prompt, persona, settings),
                LLMProviderType.AzureOpenAI => await GenerateAzureOpenAIResponseAsync(provider, prompt, persona, settings),
                LLMProviderType.LMStudio => await GenerateLMStudioResponseAsync(provider, prompt, persona, settings),
                LLMProviderType.Ollama => await GenerateOllamaResponseAsync(provider, prompt, persona, settings),
                _ => throw new NotSupportedException($"Provider type {provider.Type} is not supported")
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating response from {ProviderType} provider {ProviderName}", 
                provider.Type, provider.Name);
            return "I apologize, but I'm having trouble generating a response right now.";
        }
    }

    private async Task<string> GenerateOpenAIResponseAsync(LLMProvider provider, string prompt, string persona, ExecutionSettings? settings = null)
    {
        if (string.IsNullOrEmpty(provider.ApiKey))
            throw new InvalidOperationException("OpenAI API key is required");

        var builder = Kernel.CreateBuilder();
        builder.AddOpenAIChatCompletion(
            modelId: provider.ModelName ?? "gpt-3.5-turbo",
            apiKey: provider.ApiKey
        );
        
        var kernel = builder.Build();
        
        var systemMessage = $"You are participating in a podcast discussion. Your persona: {persona}. " +
                           "Respond naturally and conversationally, as if you're speaking in a podcast. " +
                           "Keep responses concise but engaging, typically 2-4 sentences.";
        
        // Create execution settings
        var executionSettings = new OpenAIPromptExecutionSettings();
        if (settings != null)
        {
            executionSettings.MaxTokens = settings.MaxTokens;
            executionSettings.Temperature = (float)settings.Temperature;
            if (settings.TopP.HasValue) executionSettings.TopP = (float)settings.TopP.Value;
            executionSettings.FrequencyPenalty = (float)settings.FrequencyPenalty;
            executionSettings.PresencePenalty = (float)settings.PresencePenalty;
        }
        else
        {
            // Default settings
            executionSettings.MaxTokens = 500;
            executionSettings.Temperature = 0.7f;
        }
        
        var result = await kernel.InvokePromptAsync($"{systemMessage}\n\nUser: {prompt}", 
            new KernelArguments(executionSettings));
        return result.GetValue<string>() ?? "I'm not sure how to respond to that.";
    }

    private async Task<string> GenerateAzureOpenAIResponseAsync(LLMProvider provider, string prompt, string persona, ExecutionSettings? settings = null)
    {
        if (string.IsNullOrEmpty(provider.ApiKey) || string.IsNullOrEmpty(provider.Endpoint))
            throw new InvalidOperationException("Azure OpenAI API key and endpoint are required");

        var builder = Kernel.CreateBuilder();
        builder.AddAzureOpenAIChatCompletion(
            deploymentName: provider.DeploymentName ?? provider.ModelName ?? "gpt-35-turbo",
            endpoint: provider.Endpoint,
            apiKey: provider.ApiKey
        );
        
        var kernel = builder.Build();
        
        var systemMessage = $"You are participating in a podcast discussion. Your persona: {persona}. " +
                           "Respond naturally and conversationally, as if you're speaking in a podcast. " +
                           "Keep responses concise but engaging, typically 2-4 sentences. Don't start with lables like 'Me:' or 'I:', etc.";
        
        // Create execution settings
        var executionSettings = new OpenAIPromptExecutionSettings();
        if (settings != null)
        {
            executionSettings.MaxTokens = settings.MaxTokens;
            executionSettings.Temperature = (float)settings.Temperature;
            if (settings.TopP.HasValue) executionSettings.TopP = (float)settings.TopP.Value;
            executionSettings.FrequencyPenalty = (float)settings.FrequencyPenalty;
            executionSettings.PresencePenalty = (float)settings.PresencePenalty;
        }
        else
        {
            // Default settings
            executionSettings.MaxTokens = 500;
            executionSettings.Temperature = 0.7f;
        }
        
        var result = await kernel.InvokePromptAsync($"{systemMessage}\n\nUser: {prompt}", 
            new KernelArguments(executionSettings));
        return result.GetValue<string>() ?? "I'm not sure how to respond to that.";
    }

    private async Task<string> GenerateLMStudioResponseAsync(LLMProvider provider, string prompt, string persona, ExecutionSettings? settings = null)
    {
        if (string.IsNullOrEmpty(provider.Endpoint))
            throw new InvalidOperationException("LM Studio endpoint is required");

        using var httpClient = _httpClientFactory.CreateClient();
        
        var requestBody = new
        {
            model = provider.ModelName ?? "local-model",
            messages = new[]
            {
                new { role = "system", content = $"You are participating in a podcast discussion. Your persona: {persona}. " +
                                               "Respond naturally and conversationally, as if you're speaking in a podcast. " +
                                               "Keep responses concise but engaging, typically 2-4 sentences." },
                new { role = "user", content = prompt }
            },
            temperature = settings?.Temperature ?? 0.7,
            max_tokens = settings?.MaxTokens ?? 150,
            top_p = settings?.TopP,
            frequency_penalty = settings?.FrequencyPenalty ?? 0.0,
            presence_penalty = settings?.PresencePenalty ?? 0.0
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await httpClient.PostAsync($"{provider.Endpoint.TrimEnd('/')}/v1/chat/completions", content);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "I'm not sure how to respond to that.";
    }

    private async Task<string> GenerateOllamaResponseAsync(LLMProvider provider, string prompt, string persona, ExecutionSettings? settings = null)
    {
        if (string.IsNullOrEmpty(provider.Endpoint))
            throw new InvalidOperationException("Ollama endpoint is required");

        using var httpClient = _httpClientFactory.CreateClient();
        
        var systemPrompt = $"You are participating in a podcast discussion. Your persona: {persona}. " +
                          "Respond naturally and conversationally, as if you're speaking in a podcast. " +
                          "Keep responses concise but engaging, typically 2-4 sentences.";
        
        var requestBody = new
        {
            model = provider.ModelName ?? "llama2",
            prompt = $"{systemPrompt}\n\nUser: {prompt}\n\nAssistant:",
            stream = false,
            options = new
            {
                temperature = settings?.Temperature ?? 0.7,
                num_predict = settings?.MaxTokens ?? 150,
                top_p = settings?.TopP,
                frequency_penalty = settings?.FrequencyPenalty,
                presence_penalty = settings?.PresencePenalty
            }
        };

        var json = JsonSerializer.Serialize(requestBody);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await httpClient.PostAsync($"{provider.Endpoint.TrimEnd('/')}/api/generate", content);
        response.EnsureSuccessStatusCode();
        
        var responseJson = await response.Content.ReadAsStringAsync();
        var responseObj = JsonSerializer.Deserialize<JsonElement>(responseJson);
        
        return responseObj.GetProperty("response").GetString() ?? "I'm not sure how to respond to that.";
    }
}
