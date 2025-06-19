using Microsoft.AspNetCore.Mvc;
using LLMPodcastAPI.Services;
using LLMPodcastAPI.Models;

namespace LLMPodcastAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TemplatesController : ControllerBase
{
    private readonly IPromptService _promptService;
    private readonly ILogger<TemplatesController> _logger;

    public TemplatesController(IPromptService promptService, ILogger<TemplatesController> logger)
    {
        _promptService = promptService;
        _logger = logger;
    }

    [HttpGet]
    public ActionResult<Dictionary<string, PromptTemplate>> GetAllTemplates()
    {
        try
        {
            var templates = new Dictionary<string, PromptTemplate>();
            var templateNames = new[] { "host_intro", "participant_response", "host_response", "host_conclusion" };
            
            foreach (var name in templateNames)
            {
                var template = _promptService.GetPromptTemplate(name);
                if (template != null)
                {
                    templates[name] = template;
                }
            }
            
            return Ok(templates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving templates");
            return StatusCode(500, "Error retrieving templates");
        }
    }

    [HttpGet("{templateName}")]
    public ActionResult<PromptTemplate> GetTemplate(string templateName)
    {
        try
        {
            var template = _promptService.GetPromptTemplate(templateName);
            if (template == null)
            {
                return NotFound($"Template '{templateName}' not found");
            }
            
            return Ok(template);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving template {TemplateName}", templateName);
            return StatusCode(500, "Error retrieving template");
        }
    }

    [HttpPut("{templateName}")]
    public async Task<ActionResult> UpdateTemplate(string templateName, [FromBody] PromptTemplate template)
    {
        try
        {
            var success = await _promptService.UpdateTemplateAsync(templateName, template);
            if (!success)
            {
                return BadRequest($"Failed to update template '{templateName}'");
            }
            
            return Ok(new { message = $"Template '{templateName}' updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating template {TemplateName}", templateName);
            return StatusCode(500, "Error updating template");
        }
    }

    [HttpPost("{templateName}/preview")]
    public ActionResult<string> PreviewTemplate(string templateName, [FromBody] PreviewTemplateRequest request)
    {
        try
        {
            var template = _promptService.GetPromptTemplate(templateName);
            if (template == null)
            {
                return NotFound($"Template '{templateName}' not found");
            }

            var preview = _promptService.PreviewTemplate(template.Template, request.Variables);
            return Ok(new { preview });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error previewing template {TemplateName}", templateName);
            return StatusCode(500, "Error previewing template");
        }
    }

    [HttpPost("validate")]
    public ActionResult ValidateTemplate([FromBody] PromptTemplate template)
    {
        try
        {
            var validation = _promptService.ValidateTemplate(template);
            return Ok(validation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating template");
            return StatusCode(500, "Error validating template");
        }
    }
}
