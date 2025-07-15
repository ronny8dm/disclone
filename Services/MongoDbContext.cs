using MongoDB.Driver;
using DiscloneAPI.Models;


namespace DiscloneAPI.Services
{
    public class MongoDbContext
    {
        private readonly IMongoDatabase _database;

        public MongoDbContext(MongoDbSettings settings)
        {
            var client = new MongoClient(settings.ConnectionString);
            _database = client.GetDatabase(settings.DatabaseName);
        }

        public IMongoDatabase Database => _database;

        public async Task<bool> IsConnectedAsync()
        {
            try
            {
                await _database.RunCommandAsync((Command<MongoDB.Bson.BsonDocument>)"{ping:1}");
                return true;
            }
            catch (Exception ex)
            {
                // Log the exception or handle it as needed
                Console.WriteLine($"MongoDB connection error: {ex.Message}");
                {
                    return false;
                }
            }
        }

    }
}