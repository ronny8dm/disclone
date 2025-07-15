using Microsoft.AspNetCore.Mvc;
using DiscloneAPI.Services;


namespace DiscloneAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly MongoDbContext _mongoDbContext;

        public HealthController(MongoDbContext mongoDbContext)
        {
            _mongoDbContext = mongoDbContext;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return Ok(new
            {
                IsConnected = await _mongoDbContext.IsConnectedAsync(),
                Message = "Service is running",
                Timestamp = DateTime.UtcNow,
                status = "API is running"
            });
        }

        [HttpGet("database")]
        public async Task<IActionResult> CheckDatabase()
        {
            try
            {
                var isConnected = await _mongoDbContext.IsConnectedAsync();

                if (isConnected)
                {
                    return Ok(new
                    {
                        Message = "Database is connected",
                        Timestamp = DateTime.UtcNow,
                        status = "Database is connected"
                    });
                }
                else
                {
                    return StatusCode(503, new
                    {
                        Message = "Database connection failed",
                        Timestamp = DateTime.UtcNow,
                        status = "Database connection failed"
                    });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    Message = "An error occurred while checking the database connection",
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow,
                    status = "Error checking database connection"
                });
            }
        }
    }
}