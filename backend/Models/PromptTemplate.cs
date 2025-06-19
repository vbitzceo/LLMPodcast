namespace LLMPodcastAPI.Models;

public class PromptTemplate
{
    public string Template { get; set; } = string.Empty;
    public ExecutionSettings ExecutionSettings { get; set; } = new();
    public PromptMetadata Metadata { get; set; } = new();
}

public class ExecutionSettings
{
    public int MaxTokens { get; set; } = 500;
    public double Temperature { get; set; } = 0.7;
    public int? TopK { get; set; }
    public double? TopP { get; set; }
    public double FrequencyPenalty { get; set; } = 0.0;
    public double PresencePenalty { get; set; } = 0.0;
    public string? StopSequences { get; set; }
}

public class PromptMetadata
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
    public List<string> Variables { get; set; } = new();
}
