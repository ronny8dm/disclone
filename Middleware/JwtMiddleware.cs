using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace DiscloneAPI.Middleware
{
    public class JwtMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IConfiguration _configuration;

        public JwtMiddleware(RequestDelegate next, IConfiguration configuration)
        {
            _next = next;
            _configuration = configuration;
        }

        public async Task Invoke(HttpContext context)
        {
            var token = ExtractTokenFromHeader(context);

            if (token != null)
            {
                AttachUserToContext(context, token);
            }
            await _next(context);
        }

        private string? ExtractTokenFromHeader(HttpContext context)
        {
            var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();

            if (authHeader != null && authHeader.StartsWith("Bearer"))
            {
                return authHeader.Substring("Bearer ".Length).Trim();
            }
            return null;
        }

        private void AttachUserToContext(HttpContext context, string token)
        {
            try
            {
                var secretKey = _configuration["Jwt:SecretKey"];

                if (string.IsNullOrEmpty(secretKey))
                {
                    throw new Exception("JWT Secret Key is not configured.");

                }

                var key = Encoding.UTF8.GetBytes(secretKey);
                var tokenHandler = new JwtSecurityTokenHandler();
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? _configuration["Jwt:Issuer"],
                    ValidAudience = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? _configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero // Disable clock skew for immediate expiration
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);

                var userId = principal.FindFirst("userId")?.Value;
                var username = principal.FindFirst(ClaimTypes.Name)?.Value;

                context.Items["UserId"] = userId;
                context.Items["Username"] = username;
                context.Items["User"] = principal;

            }
            catch (Exception ex)
            {
                Console.WriteLine($"JWT validation failed: {ex.Message}");
            }
        }
    }
}
