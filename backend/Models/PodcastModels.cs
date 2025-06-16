using System.ComponentModel.DataAnnotations;

namespace LLMPodcastAPI.Models;

public class LLMProvider
{
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public LLMProviderType Type { get; set; }
    
    public string? ApiKey { get; set; }
    
    public string? Endpoint { get; set; }
    
    public string? DeploymentName { get; set; } // For Azure OpenAI
    
    public string? ModelName { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum LLMProviderType
{
    OpenAI = 1,
    AzureOpenAI = 2,
    LMStudio = 3,
    Ollama = 4
}

public class Participant
{
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public string Persona { get; set; } = string.Empty;
    
    public int LLMProviderId { get; set; }
    public LLMProvider LLMProvider { get; set; } = null!;
    
    public string? VoiceName { get; set; }
    
    public bool IsHost { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PodcastSession
{
    public int Id { get; set; }
    
    [Required]
    public string Topic { get; set; } = string.Empty;
    
    public List<Participant> Participants { get; set; } = new();
    
    public List<PodcastMessage> Messages { get; set; } = new();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? CompletedAt { get; set; }
    
    public PodcastStatus Status { get; set; } = PodcastStatus.Created;
}

public class PodcastMessage
{
    public int Id { get; set; }
    
    public int PodcastSessionId { get; set; }
    public PodcastSession PodcastSession { get; set; } = null!;
    
    public int ParticipantId { get; set; }
    public Participant Participant { get; set; } = null!;
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    public string? AudioUrl { get; set; }
    
    public int Order { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public enum PodcastStatus
{
    Created = 1,
    InProgress = 2,
    Completed = 3,
    Failed = 4
}
