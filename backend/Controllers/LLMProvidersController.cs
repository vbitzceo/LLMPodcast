using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LLMPodcastAPI.Data;
using LLMPodcastAPI.Models;

namespace LLMPodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LLMProvidersController : ControllerBase
{
    private readonly PodcastContext _context;
    private readonly ILogger<LLMProvidersController> _logger;

    public LLMProvidersController(PodcastContext context, ILogger<LLMProvidersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<LLMProvider>>> GetLLMProviders()
    {
        return await _context.LLMProviders
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<LLMProvider>> GetLLMProvider(int id)
    {
        var provider = await _context.LLMProviders.FindAsync(id);
        if (provider == null)
        {
            return NotFound();
        }
        return provider;
    }

    [HttpPost]
    public async Task<ActionResult<LLMProvider>> CreateLLMProvider(CreateLLMProviderRequest request)
    {
        var provider = new LLMProvider
        {
            Name = request.Name,
            Type = request.Type,
            ApiKey = request.ApiKey,
            Endpoint = request.Endpoint,
            DeploymentName = request.DeploymentName,
            ModelName = request.ModelName,
            IsActive = true
        };

        _context.LLMProviders.Add(provider);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLLMProvider), new { id = provider.Id }, provider);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLLMProvider(int id, UpdateLLMProviderRequest request)
    {
        var provider = await _context.LLMProviders.FindAsync(id);
        if (provider == null)
        {
            return NotFound();
        }

        provider.Name = request.Name;
        provider.ApiKey = request.ApiKey;
        provider.Endpoint = request.Endpoint;
        provider.DeploymentName = request.DeploymentName;
        provider.ModelName = request.ModelName;
        provider.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteLLMProvider(int id)
    {
        var provider = await _context.LLMProviders.FindAsync(id);
        if (provider == null)
        {
            return NotFound();
        }

        provider.IsActive = false; // Soft delete
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
