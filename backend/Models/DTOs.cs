namespace LLMPodcastAPI.Models;

public class CreatePodcastRequest
{
    public string Topic { get; set; } = string.Empty;
    public List<ParticipantRequest> Participants { get; set; } = new();
    public int Rounds { get; set; } = 3;
}

public class ParticipantRequest
{
    public string Name { get; set; } = string.Empty;
    public string Persona { get; set; } = string.Empty;
    public int LLMProviderId { get; set; }
    public string? VoiceName { get; set; }
    public bool IsHost { get; set; } = false;
}

public class CreateLLMProviderRequest
{
    public string Name { get; set; } = string.Empty;
    public LLMProviderType Type { get; set; }
    public string? ApiKey { get; set; }
    public string? Endpoint { get; set; }
    public string? DeploymentName { get; set; }
    public string? ModelName { get; set; }
}

public class UpdateLLMProviderRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public string? Endpoint { get; set; }
    public string? DeploymentName { get; set; }
    public string? ModelName { get; set; }
    public bool IsActive { get; set; } = true;
}

public class PodcastResponse
{
    public int Id { get; set; }
    public string Topic { get; set; } = string.Empty;
    public int Rounds { get; set; } = 3;
    public List<ParticipantResponse> Participants { get; set; } = new();
    public List<MessageResponse> Messages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public PodcastStatus Status { get; set; }
}

public class ParticipantResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Persona { get; set; } = string.Empty;
    public string LLMProviderName { get; set; } = string.Empty;
    public string? VoiceName { get; set; }
    public bool IsHost { get; set; }
}

public class MessageResponse
{
    public int Id { get; set; }
    public string ParticipantName { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? AudioUrl { get; set; }
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class VoiceOption
{
    public string Name { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Locale { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
}

public class PreviewTemplateRequest
{
    public Dictionary<string, string> Variables { get; set; } = new();
}

public class TemplateValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = new();
    public List<string> Warnings { get; set; } = new();
    public List<string> DetectedVariables { get; set; } = new();
}
