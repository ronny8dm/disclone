using Microsoft.AspNetCore.Mvc;
using System.Net.WebSockets;
using DiscloneAPI.Services;

namespace DiscloneAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MessageController : ControllerBase
    {
        private readonly IWebSocketManager _webSocketManager;
        private readonly ILogger<MessageController> _logger;


        public MessageController(IWebSocketManager webSocketManager, ILogger<MessageController> logger)
        {
            _webSocketManager = webSocketManager;
            _logger = logger;
        }


        [Route("/ws/connect")]
        public async Task ConnectWebSocket()
        {
            if (HttpContext.WebSockets.IsWebSocketRequest)
            {
                var userId = HttpContext.Request.Query["userId"].ToString();

                if (string.IsNullOrEmpty(userId))
                {
                    HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                    await HttpContext.Response.WriteAsync("User ID is required.");
                    return;
                }

                _logger.LogInformation($"WebSocket connection request for user {userId}");

                var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
                await _webSocketManager.HandleWebSocketAsync(userId, webSocket);
            }
            else
            {
                HttpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
                await HttpContext.Response.WriteAsync("WebSocket request expected.");
            }
        }
    }
}