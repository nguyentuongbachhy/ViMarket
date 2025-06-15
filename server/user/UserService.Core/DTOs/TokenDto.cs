namespace UserService.Core.DTOs
{
    public class TokenDto
    {
        public required string AccessToken { get; set; }
        public string TokenType { get; set; } = "Bearer";
        public long ExpiresAt { get; set; }
        public required UserDto User { get; set; }
    }
}