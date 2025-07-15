using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace DiscloneAPI.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("name")]
        public string Name { get; set; } = string.Empty;

        [BsonElement("username")]
        public string Username { get; set; } = string.Empty;

        [BsonElement("avatar")]
        public string? Avatar { get; set; }

        [BsonElement("status")]
        public UserStatus Status { get; set; } = UserStatus.Online;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("lastActiveAt")]
        public DateTime LastActiveAt { get; set; } = DateTime.UtcNow;
    }

    public enum UserStatus
    {
        Online,
        Idle,
        DND,
        Offline,
        Mobile
    }
}