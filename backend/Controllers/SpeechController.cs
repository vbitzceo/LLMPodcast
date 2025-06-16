using Microsoft.AspNetCore.Mvc;
using LLMPodcastAPI.Services;
using LLMPodcastAPI.Models;

namespace LLMPodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpeechController : ControllerBase
{
    private readonly ISpeechService _speechService;

    public SpeechController(ISpeechService speechService)
    {
        _speechService = speechService;
    }

    [HttpGet("voices")]
    public async Task<ActionResult<IEnumerable<VoiceOption>>> GetVoices()
    {
        var voices = await _speechService.GetAvailableVoicesAsync();
        return Ok(voices);
    }
}
