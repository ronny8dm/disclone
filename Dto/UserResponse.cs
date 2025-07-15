namespace DiscloneAPI.Models.Dto
{
    public class UserResponse
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public UserStatus Status { get; set; }
        public DateTime LastActiveAt { get; set; }
    }
}