using DiscloneAPI.Models;
using DiscloneAPI.Models.Dto;
using MongoDB.Driver;

namespace DiscloneAPI.Services
{
    public interface IUserService
    {
        Task<CreateUserResponse?> CreateUserAsync(CreateUserRequest request);
        Task<UserResponse?> GetUserByIdAsync(string id);
        Task<UserResponse?> GetUserByUsernameAsync(string username);
        Task<bool> UsernameExistsAsync(string username);
        Task UpdateLastActiveAsync(string userId);
        Task UpdateUserStatusAsync(string userId, UserStatus status);
        Task<IEnumerable<UserResponse>> GetUsersAsync(int skip = 0, int limit = 50);
    }

    public class UserService : IUserService
    {
        private readonly IMongoCollection<User> _users;
        private readonly ITokenService _tokenService;

        public UserService(MongoDbContext context, ITokenService tokenService)
        {
            _users = context.Database.GetCollection<User>("users");
            _tokenService = tokenService;
        }

        public async Task<CreateUserResponse?> CreateUserAsync(CreateUserRequest request)
        {
            // Check if username already exists
            if (await UsernameExistsAsync(request.Username))
            {
                return null; // Username taken
            }

            var user = new User
            {
                Name = request.Name.Trim(),
                Username = request.Username.Trim().ToLower(),
                Avatar = request.Avatar,
                Status = UserStatus.Online,
                CreatedAt = DateTime.UtcNow,
                LastActiveAt = DateTime.UtcNow
            };

            await _users.InsertOneAsync(user);

            // Generate token
            var token = _tokenService.GenerateToken(user.Id, user.Username);

            return new CreateUserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Avatar = user.Avatar,
                Status = user.Status,
                Token = token,
                CreatedAt = user.CreatedAt
            };
        }

        public async Task<UserResponse?> GetUserByIdAsync(string id)
        {
            var user = await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
            if (user == null) return null;

            return new UserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Avatar = user.Avatar,
                Status = user.Status,
                LastActiveAt = user.LastActiveAt
            };
        }

        public async Task<UserResponse?> GetUserByUsernameAsync(string username)
        {
            var user = await _users.Find(u => u.Username == username.ToLower()).FirstOrDefaultAsync();
            if (user == null) return null;

            return new UserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Avatar = user.Avatar,
                Status = user.Status,
                LastActiveAt = user.LastActiveAt
            };
        }

        public async Task<bool> UsernameExistsAsync(string username)
        {
            var count = await _users.CountDocumentsAsync(u => u.Username == username.ToLower());
            return count > 0;
        }

        public async Task UpdateLastActiveAsync(string userId)
        {
            var update = Builders<User>.Update.Set(u => u.LastActiveAt, DateTime.UtcNow);
            await _users.UpdateOneAsync(u => u.Id == userId, update);
        }

        public async Task UpdateUserStatusAsync(string userId, UserStatus status)
        {
            var update = Builders<User>.Update
            .Set(u => u.Status, status)
            .Set(u => u.LastActiveAt, DateTime.UtcNow);

            await _users.UpdateOneAsync(u => u.Id == userId, update);
        }

        public async Task<IEnumerable<UserResponse>> GetUsersAsync(int skip = 0, int limt = 50)
        {
            var users = await _users
            .Find(_ => true)
            .Sort(Builders<User>.Sort.Descending(u => u.LastActiveAt))
            .Skip(skip)
            .Limit(limt)
            .ToListAsync();

            return users.Select(user => new UserResponse
            {
                Id = user.Id,
                Name = user.Name,
                Username = user.Username,
                Avatar = user.Avatar,
                Status = user.Status,
                LastActiveAt = user.LastActiveAt
            });
        }

    }
}