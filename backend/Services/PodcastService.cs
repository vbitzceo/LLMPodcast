using Microsoft.EntityFrameworkCore;
using LLMPodcastAPI.Data;
using LLMPodcastAPI.Models;

namespace LLMPodcastAPI.Services;

public interface IPodcastService
{
    Task<PodcastSession> CreatePodcastSessionAsync(CreatePodcastRequest request);
    Task<PodcastSession?> GetPodcastSessionAsync(int id);
    Task<List<PodcastSession>> GetPodcastSessionsAsync();
    Task<PodcastSession> GeneratePodcastAsync(int sessionId);
    Task<bool> DeletePodcastSessionAsync(int id);
}

public class PodcastService : IPodcastService
{
    private readonly PodcastContext _context;
    private readonly ILLMProviderService _llmService;
    private readonly ISpeechService _speechService;
    private readonly IPromptService _promptService;
    private readonly ILogger<PodcastService> _logger;

    public PodcastService(
        PodcastContext context,
        ILLMProviderService llmService,
        ISpeechService speechService,
        IPromptService promptService,
        ILogger<PodcastService> logger)
    {
        _context = context;
        _llmService = llmService;
        _speechService = speechService;
        _promptService = promptService;
        _logger = logger;
    }

    public async Task<PodcastSession> CreatePodcastSessionAsync(CreatePodcastRequest request)
    {
        var session = new PodcastSession
        {
            Topic = request.Topic,
            Rounds = request.Rounds
        };

        _context.PodcastSessions.Add(session);
        await _context.SaveChangesAsync();

        foreach (var participantRequest in request.Participants)
        {
            var llmProvider = await _context.LLMProviders
                .FirstOrDefaultAsync(p => p.Id == participantRequest.LLMProviderId);
            
            if (llmProvider == null)
                throw new ArgumentException($"LLM Provider with ID {participantRequest.LLMProviderId} not found");

            var participant = new Participant
            {
                Name = participantRequest.Name,
                Persona = participantRequest.Persona,
                LLMProviderId = participantRequest.LLMProviderId,
                VoiceName = participantRequest.VoiceName,
                IsHost = participantRequest.IsHost
            };

            _context.Participants.Add(participant);
            await _context.SaveChangesAsync();

            session.Participants.Add(participant);
        }

        await _context.SaveChangesAsync();
        return session;
    }

    public async Task<PodcastSession?> GetPodcastSessionAsync(int id)
    {
        return await _context.PodcastSessions
            .Include(s => s.Participants)
                .ThenInclude(p => p.LLMProvider)
            .Include(s => s.Messages)
                .ThenInclude(m => m.Participant)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<List<PodcastSession>> GetPodcastSessionsAsync()
    {
        return await _context.PodcastSessions
            .Include(s => s.Participants)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();
    }

    public async Task<PodcastSession> GeneratePodcastAsync(int sessionId)
    {
        var session = await GetPodcastSessionAsync(sessionId);
        if (session == null)
            throw new ArgumentException($"Podcast session with ID {sessionId} not found");

        session.Status = PodcastStatus.InProgress;
        await _context.SaveChangesAsync();

        try
        {
            var host = session.Participants.FirstOrDefault(p => p.IsHost) 
                      ?? session.Participants.First();
            
            var participants = session.Participants.Where(p => !p.IsHost).ToList();
            var allParticipants = new List<Participant> { host }.Concat(participants).ToList();

            // Generate introduction by host
            var participantNames = participants.Select(p => p.Name).ToList();
            var participantNamesText = participantNames.Count > 1 
                ? string.Join(", ", participantNames.Take(participantNames.Count - 1)) + " and " + participantNames.Last()
                : participantNames.FirstOrDefault() ?? "";
            
            var introPrompt = _promptService.GetHostIntroPrompt(session.Topic, host.Persona, participantNamesText);
            var introSettings = _promptService.GetExecutionSettings("host_intro");
            
            var introResponse = await _llmService.GenerateResponseAsync(
                host.LLMProvider, introPrompt, host.Persona, introSettings);
            
            await AddMessageAsync(session, host, introResponse, 1);

            // Generate conversation rounds
            var conversationHistory = new List<string> { introResponse };
            var messageOrder = 2;

            for (int round = 0; round < session.Rounds; round++) // User-defined number of rounds
            {
                foreach (var participant in participants)
                {
                    var context = string.Join("\n\n", conversationHistory.TakeLast(4)); // Last 4 messages for context, no names
                    var prompt = _promptService.GetParticipantResponsePrompt(session.Topic, participant.Persona, context);
                    var participantSettings = _promptService.GetExecutionSettings("participant_response");
                    
                    var response = await _llmService.GenerateResponseAsync(
                        participant.LLMProvider, prompt, participant.Persona, participantSettings);
                    
                    // Clean up any accidental name labels or prefixes
                    var cleanResponse = CleanResponse(response, participant.Name);
                    
                    await AddMessageAsync(session, participant, cleanResponse, messageOrder++);
                    conversationHistory.Add(cleanResponse);
                }

                // Host response
                if (round < 2) // Don't have host respond after the last round
                {
                    var context = string.Join("\n\n", conversationHistory.TakeLast(4));
                    var hostPrompt = _promptService.GetHostResponsePrompt(session.Topic, host.Persona, context);
                    var hostSettings = _promptService.GetExecutionSettings("host_response");
                    
                    var hostResponse = await _llmService.GenerateResponseAsync(
                        host.LLMProvider, hostPrompt, host.Persona, hostSettings);
                    
                    // Clean up any accidental name labels or prefixes
                    var cleanHostResponse = CleanResponse(hostResponse, host.Name);
                    
                    await AddMessageAsync(session, host, cleanHostResponse, messageOrder++);
                    conversationHistory.Add(cleanHostResponse);
                }
            }

            // Generate conclusion by host
            var finalContext = string.Join("\n\n", conversationHistory.TakeLast(6));
            var conclusionPrompt = _promptService.GetHostConclusionPrompt(session.Topic, host.Persona, finalContext);
            var conclusionSettings = _promptService.GetExecutionSettings("host_conclusion");
            
            var conclusionResponse = await _llmService.GenerateResponseAsync(
                host.LLMProvider, conclusionPrompt, host.Persona, conclusionSettings);
            
            // Clean up any accidental name labels or prefixes
            var cleanConclusionResponse = CleanResponse(conclusionResponse, host.Name);
            
            await AddMessageAsync(session, host, cleanConclusionResponse, messageOrder);

            session.Status = PodcastStatus.Completed;
            session.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return session;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating podcast for session {SessionId}", sessionId);
            session.Status = PodcastStatus.Failed;
            await _context.SaveChangesAsync();
            throw;
        }
    }

    private async Task AddMessageAsync(PodcastSession session, Participant participant, string content, int order)
    {
        var message = new PodcastMessage
        {
            PodcastSessionId = session.Id,
            ParticipantId = participant.Id,
            Content = content,
            Order = order
        };

        // Generate audio if voice is configured
        if (!string.IsNullOrEmpty(participant.VoiceName))
        {
            try
            {
                message.AudioUrl = await _speechService.TextToSpeechAsync(content, participant.VoiceName);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to generate audio for message from {ParticipantName}", participant.Name);
            }
        }

        _context.PodcastMessages.Add(message);
        await _context.SaveChangesAsync();
    }

    private string CleanResponse(string response, string participantName)
    {
        if (string.IsNullOrWhiteSpace(response))
            return response;

        // Remove common prefixes that LLMs might add
        var cleanedResponse = response.Trim();
        
        // Remove name prefixes like "John:", "Me:", etc.
        var prefixPatterns = new[]
        {
            $"{participantName}:",
            $"{participantName.ToLower()}:",
            "Me:",
            "me:",
            "I:",
            "i:"
        };

        foreach (var prefix in prefixPatterns)
        {
            if (cleanedResponse.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            {
                cleanedResponse = cleanedResponse.Substring(prefix.Length).Trim();
                break;
            }
        }

        // Remove quotes if the entire response is quoted
        if (cleanedResponse.StartsWith("\"") && cleanedResponse.EndsWith("\"") && cleanedResponse.Length > 2)
        {
            cleanedResponse = cleanedResponse.Substring(1, cleanedResponse.Length - 2).Trim();
        }

        return cleanedResponse;
    }

    public async Task<bool> DeletePodcastSessionAsync(int id)
    {
        try
        {
            var session = await _context.PodcastSessions
                .Include(s => s.Messages)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (session == null)
                return false;

            // Delete associated audio files
            foreach (var message in session.Messages.Where(m => !string.IsNullOrEmpty(m.AudioUrl)))
            {
                try
                {
                    var audioPath = Path.Combine("wwwroot", message.AudioUrl!.TrimStart('/'));
                    if (File.Exists(audioPath))
                    {
                        File.Delete(audioPath);
                        _logger.LogInformation("Deleted audio file: {AudioPath}", audioPath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete audio file for message {MessageId}", message.Id);
                }
            }

            // Delete the podcast session (cascade delete will handle messages and participants)
            _context.PodcastSessions.Remove(session);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted podcast session {SessionId}", id);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting podcast session {SessionId}", id);
            return false;
        }
    }
}
