using Microsoft.EntityFrameworkCore;
using LLMPodcastAPI.Models;

namespace LLMPodcastAPI.Data;

public class PodcastContext : DbContext
{
    public PodcastContext(DbContextOptions<PodcastContext> options) : base(options)
    {
    }

    public DbSet<LLMProvider> LLMProviders { get; set; }
    public DbSet<Participant> Participants { get; set; }
    public DbSet<PodcastSession> PodcastSessions { get; set; }
    public DbSet<PodcastMessage> PodcastMessages { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure LLMProvider
        modelBuilder.Entity<LLMProvider>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.ApiKey).HasMaxLength(500);
            entity.Property(e => e.Endpoint).HasMaxLength(500);
            entity.Property(e => e.DeploymentName).HasMaxLength(100);
            entity.Property(e => e.ModelName).HasMaxLength(100);
        });

        // Configure Participant
        modelBuilder.Entity<Participant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Persona).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.VoiceName).HasMaxLength(100);
            
            entity.HasOne(e => e.LLMProvider)
                  .WithMany()
                  .HasForeignKey(e => e.LLMProviderId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Configure PodcastSession
        modelBuilder.Entity<PodcastSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Topic).IsRequired().HasMaxLength(500);
            
            entity.HasMany(e => e.Participants)
                  .WithMany()
                  .UsingEntity(j => j.ToTable("PodcastSessionParticipants"));
            
            entity.HasMany(e => e.Messages)
                  .WithOne(e => e.PodcastSession)
                  .HasForeignKey(e => e.PodcastSessionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure PodcastMessage
        modelBuilder.Entity<PodcastMessage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.AudioUrl).HasMaxLength(500);
            
            entity.HasOne(e => e.Participant)
                  .WithMany()
                  .HasForeignKey(e => e.ParticipantId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Seed data
        modelBuilder.Entity<LLMProvider>().HasData(
            new LLMProvider
            {
                Id = 1,
                Name = "OpenAI GPT-4",
                Type = LLMProviderType.OpenAI,
                ModelName = "gpt-4",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            },
            new LLMProvider
            {
                Id = 2,
                Name = "OpenAI GPT-3.5 Turbo",
                Type = LLMProviderType.OpenAI,
                ModelName = "gpt-3.5-turbo",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        );
    }
}
