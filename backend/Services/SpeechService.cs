using Microsoft.CognitiveServices.Speech;
using Microsoft.CognitiveServices.Speech.Audio;
using LLMPodcastAPI.Models;

namespace LLMPodcastAPI.Services;

public interface ISpeechService
{
    Task<string?> TextToSpeechAsync(string text, string voiceName);
    Task<List<VoiceOption>> GetAvailableVoicesAsync();
}

public class SpeechService : ISpeechService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SpeechService> _logger;
    private readonly string _speechKey;
    private readonly string _speechRegion;

    public SpeechService(IConfiguration configuration, ILogger<SpeechService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        _speechKey = _configuration["AzureSpeech:SubscriptionKey"] ?? "";
        _speechRegion = _configuration["AzureSpeech:Region"] ?? "";
    }

    public async Task<string?> TextToSpeechAsync(string text, string voiceName)
    {
        if (string.IsNullOrEmpty(_speechKey) || string.IsNullOrEmpty(_speechRegion))
        {
            _logger.LogWarning("Azure Speech service not configured. Skipping text-to-speech.");
            return null;
        }

        try
        {
            var config = SpeechConfig.FromSubscription(_speechKey, _speechRegion);
            config.SpeechSynthesisVoiceName = voiceName;
            config.SetSpeechSynthesisOutputFormat(SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3);

            var fileName = $"audio_{Guid.NewGuid()}.mp3";
            var filePath = Path.Combine("wwwroot", "audio", fileName);
            
            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(filePath)!);

            // Use AudioConfig.FromDefaultSpeakerOutput() and handle the audio data manually
            using var synthesizer = new SpeechSynthesizer(config, null);
            
            var result = await synthesizer.SpeakTextAsync(text);
            
            if (result.Reason == ResultReason.SynthesizingAudioCompleted)
            {
                // Write the audio data directly to file
                await File.WriteAllBytesAsync(filePath, result.AudioData);
                return $"/audio/{fileName}";
            }
            else
            {
                _logger.LogError("Speech synthesis failed: {Reason}", result.Reason);
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during text-to-speech conversion");
            return null;
        }
    }

    public async Task<List<VoiceOption>> GetAvailableVoicesAsync()
    {
        if (string.IsNullOrEmpty(_speechKey) || string.IsNullOrEmpty(_speechRegion))
        {
            return GetDefaultVoices();
        }

        try
        {
            var config = SpeechConfig.FromSubscription(_speechKey, _speechRegion);
            using var synthesizer = new SpeechSynthesizer(config);
            
            var result = await synthesizer.GetVoicesAsync();
            
            if (result.Reason == ResultReason.VoicesListRetrieved)
            {
                return result.Voices
                    .Where(v => v.Locale.StartsWith("en-"))
                    .Select(v => new VoiceOption
                    {
                        Name = v.ShortName,
                        DisplayName = v.LocalName,
                        Locale = v.Locale,
                        Gender = v.Gender.ToString()
                    })
                    .OrderBy(v => v.DisplayName)
                    .ToList();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving available voices");
        }

        return GetDefaultVoices();
    }

    private static List<VoiceOption> GetDefaultVoices()
    {
        return new List<VoiceOption>
        {
            new() { Name = "en-US-AriaNeural", DisplayName = "Aria (US Female)", Locale = "en-US", Gender = "Female" },
            new() { Name = "en-US-DavisNeural", DisplayName = "Davis (US Male)", Locale = "en-US", Gender = "Male" },
            new() { Name = "en-US-GuyNeural", DisplayName = "Guy (US Male)", Locale = "en-US", Gender = "Male" },
            new() { Name = "en-US-JaneNeural", DisplayName = "Jane (US Female)", Locale = "en-US", Gender = "Female" },
            new() { Name = "en-US-JasonNeural", DisplayName = "Jason (US Male)", Locale = "en-US", Gender = "Male" },
            new() { Name = "en-US-JennyNeural", DisplayName = "Jenny (US Female)", Locale = "en-US", Gender = "Female" },
            new() { Name = "en-US-NancyNeural", DisplayName = "Nancy (US Female)", Locale = "en-US", Gender = "Female" },
            new() { Name = "en-US-TonyNeural", DisplayName = "Tony (US Male)", Locale = "en-US", Gender = "Male" }
        };
    }
}
