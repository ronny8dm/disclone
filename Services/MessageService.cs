using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Text.Json;

namespace DiscloneAPI.Services
{
    public interface IWebSocketManager
    {
        Task AddConnectionAsync(string userId, WebSocket webSocket);
        Task RemoveConnectionAsync(string userId);
        Task SendMessageToUserAsync(string userId, object message);
        Task SendMessageToConversationAsync(string conversationId, object message, string? excludeUserId = null);
        Task BroadcastAsync(object message);
        Task HandleWebSocketAsync(string userId, WebSocket webSocket);
        Task JoinConversationAsync(string userId, string conversationId);
        Task LeaveConversationAsync(string userId, string conversationId);
    }

    public class MessageService : IWebSocketManager
    {
        private readonly ConcurrentDictionary<string, WebSocket> _connections = new();
        private readonly ConcurrentDictionary<string, string> _userConnections = new();
        private readonly ConcurrentDictionary<string, List<string>> _conversationUsers = new();
        private readonly ILogger<MessageService> _logger;


        public MessageService(ILogger<MessageService> logger)
        {
            _logger = logger;
        }

        public async Task AddConnectionAsync(string userId, WebSocket webSocket)
        {
            var connectionId = Guid.NewGuid().ToString();
            _connections[connectionId] = webSocket;
            _userConnections[userId] = connectionId;

            _logger.LogInformation($"User {userId} connected with connection ID {connectionId}");

            await SendToWebSocketAsync(webSocket, new
            {
                type = "connection_established",
                userId = userId,
                connectionId = connectionId,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task RemoveConnectionAsync(string userId)
        {
            if (_userConnections.TryRemove(userId, out var connectionId))
            {
                _connections.TryRemove(connectionId, out _);
                _logger.LogInformation($"User {userId} disconnected with connection ID {connectionId}");
                await SendMessageToUserAsync(userId, new
                {
                    type = "disconnection",
                    userId = userId,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        public async Task SendMessageToUserAsync(string userId, object message)
        {
            if (_userConnections.TryGetValue(userId, out var connectionId) &&
                _connections.TryGetValue(connectionId, out var webSocket))
            {
                await SendToWebSocketAsync(webSocket, message);
            }
        }

        public async Task SendMessageToConversationAsync(string conversationId, object message, string? excludeUserId = null)
        {
            if (_conversationUsers.TryGetValue(conversationId, out var userIds))
            {
                var tasks = userIds
                    .Where(userId => userId != excludeUserId)
                    .Select(userId => SendMessageToUserAsync(userId, message));
                await Task.WhenAll(tasks);
            }
        }

        public async Task BroadcastAsync(object message)
        {
            var tasks = _connections.Values.Select(ws => SendToWebSocketAsync(ws, message));
            await Task.WhenAll(tasks);
        }

        public async Task HandleWebSocketAsync(string userId, WebSocket webSocket)
        {
            await AddConnectionAsync(userId, webSocket);

            var buffer = new byte[1024 * 4];

            try
            {
                while (webSocket.State == WebSocketState.Open)
                {
                    var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

                    if (result.MessageType == WebSocketMessageType.Text)
                    {
                        var message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                        await HandleIncomingMessage(userId, message);
                    }
                    else if (result.MessageType == WebSocketMessageType.Close)
                    {
                        await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, "", CancellationToken.None);
                        break;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"WebSocket error for user {userId}");
            }
            finally
            {
                await RemoveConnectionAsync(userId);
            }
        }

        public async Task JoinConversationAsync(string userId, string conversationId)
        {
            if (!_conversationUsers.ContainsKey(conversationId))
            {
                _conversationUsers[conversationId] = new List<string>();
            }

            if (!_conversationUsers[conversationId].Contains(userId))
            {
                _conversationUsers[conversationId].Add(userId);
                _logger.LogInformation($"User {userId} joined conversation {conversationId}");
            }
        }

        public async Task LeaveConversationAsync(string userId, string conversationId)
        {
            if (_conversationUsers.TryGetValue(conversationId, out var users))
            {
                users.Remove(userId);
                if (users.Count == 0)
                {
                    _conversationUsers.TryRemove(conversationId, out _);
                }
                _logger.LogInformation($"User {userId} left conversation {conversationId}");
            }
        }

        private async Task HandleIncomingMessage(string userId, string message)
        {
            try
            {
                var messageData = JsonSerializer.Deserialize<WebSocketMessage>(message);

                switch (messageData?.Type?.ToLower())
                {
                    case "join_conversation":
                        if (messageData.ConversationId != null)
                        {
                            await JoinConversationAsync(userId, messageData.ConversationId);
                        }
                        break;

                    case "leave_conversation":
                        if (messageData.ConversationId != null)
                        {
                            await LeaveConversationAsync(userId, messageData.ConversationId);
                        }
                        break;

                    case "typing_start":
                        if (messageData.ConversationId != null)
                        {
                            await SendMessageToConversationAsync(messageData.ConversationId, new
                            {
                                type = "user_typing_start",
                                userId = userId,
                                conversationId = messageData.ConversationId,
                                timestamp = DateTime.UtcNow
                            }, userId);
                        }
                        break;

                    case "typing_stop":
                        if (messageData.ConversationId != null)
                        {
                            await SendMessageToConversationAsync(messageData.ConversationId, new
                            {
                                type = "user_typing_stop",
                                userId = userId,
                                conversationId = messageData.ConversationId,
                                timestamp = DateTime.UtcNow
                            }, userId);
                        }
                        break;

                    case "ping":
                        await SendMessageToUserAsync(userId, new
                        {
                            type = "pong",
                            timestamp = DateTime.UtcNow
                        });
                        break;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error handling message from user {userId}: {message}");
            }
        }

        private async Task SendToWebSocketAsync(WebSocket webSocket, object message)
        {
            if (webSocket.State == WebSocketState.Open)
            {
                var json = JsonSerializer.Serialize(message);
                var buffer = Encoding.UTF8.GetBytes(json);
                await webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, CancellationToken.None);
            }
        }
    }

    public class WebSocketMessage
    {
        public string? Type { get; set; }
        public string? ConversationId { get; set; }
        public string? Content { get; set; }
        public object? Data { get; set; }
    }
}