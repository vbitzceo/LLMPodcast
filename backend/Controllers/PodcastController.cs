using Microsoft.AspNetCore.Mvc;
using LLMPodcastAPI.Services;
using LLMPodcastAPI.Models;

namespace LLMPodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PodcastController : ControllerBase
{
    private readonly IPodcastService _podcastService;
    private readonly ILogger<PodcastController> _logger;

    public PodcastController(IPodcastService podcastService, ILogger<PodcastController> logger)
    {
        _podcastService = podcastService;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<PodcastResponse>>> GetPodcasts()
    {
        var sessions = await _podcastService.GetPodcastSessionsAsync();
        var response = sessions.Select(s => new PodcastResponse
        {
            Id = s.Id,
            Topic = s.Topic,
            Status = s.Status,
            CreatedAt = s.CreatedAt,
            CompletedAt = s.CompletedAt,
            Participants = s.Participants.Select(p => new ParticipantResponse
            {
                Id = p.Id,
                Name = p.Name,
                Persona = p.Persona,
                IsHost = p.IsHost,
                VoiceName = p.VoiceName
            }).ToList()
        });

        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<PodcastResponse>> GetPodcast(int id)
    {
        var session = await _podcastService.GetPodcastSessionAsync(id);
        if (session == null)
        {
            return NotFound();
        }

        var response = new PodcastResponse
        {
            Id = session.Id,
            Topic = session.Topic,
            Status = session.Status,
            CreatedAt = session.CreatedAt,
            CompletedAt = session.CompletedAt,
            Participants = session.Participants.Select(p => new ParticipantResponse
            {
                Id = p.Id,
                Name = p.Name,
                Persona = p.Persona,
                LLMProviderName = p.LLMProvider.Name,
                IsHost = p.IsHost,
                VoiceName = p.VoiceName
            }).ToList(),
            Messages = session.Messages
                .OrderBy(m => m.Order)
                .Select(m => new MessageResponse
                {
                    Id = m.Id,
                    ParticipantName = m.Participant.Name,
                    Content = m.Content,
                    AudioUrl = m.AudioUrl,
                    Order = m.Order,
                    CreatedAt = m.CreatedAt
                }).ToList()
        };

        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<PodcastResponse>> CreatePodcast(CreatePodcastRequest request)
    {
        try
        {
            var session = await _podcastService.CreatePodcastSessionAsync(request);
            
            var response = new PodcastResponse
            {
                Id = session.Id,
                Topic = session.Topic,
                Status = session.Status,
                CreatedAt = session.CreatedAt,
                Participants = session.Participants.Select(p => new ParticipantResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Persona = p.Persona,
                    IsHost = p.IsHost,
                    VoiceName = p.VoiceName
                }).ToList()
            };

            return CreatedAtAction(nameof(GetPodcast), new { id = session.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating podcast");
            return BadRequest("Failed to create podcast: " + ex.Message);
        }
    }

    [HttpPost("{id}/generate")]
    public async Task<ActionResult<PodcastResponse>> GeneratePodcast(int id)
    {
        try
        {
            var session = await _podcastService.GeneratePodcastAsync(id);
            
            var response = new PodcastResponse
            {
                Id = session.Id,
                Topic = session.Topic,
                Status = session.Status,
                CreatedAt = session.CreatedAt,
                CompletedAt = session.CompletedAt,
                Participants = session.Participants.Select(p => new ParticipantResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Persona = p.Persona,
                    LLMProviderName = p.LLMProvider.Name,
                    IsHost = p.IsHost,
                    VoiceName = p.VoiceName
                }).ToList(),
                Messages = session.Messages
                    .OrderBy(m => m.Order)
                    .Select(m => new MessageResponse
                    {
                        Id = m.Id,
                        ParticipantName = m.Participant.Name,
                        Content = m.Content,
                        AudioUrl = m.AudioUrl,
                        Order = m.Order,
                        CreatedAt = m.CreatedAt
                    }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating podcast {PodcastId}", id);
            return BadRequest("Failed to generate podcast: " + ex.Message);
        }
    }
}
