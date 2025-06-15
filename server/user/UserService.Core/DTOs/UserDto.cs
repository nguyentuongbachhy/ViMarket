using System;

namespace UserService.Core.DTOs
{
    public class UserDto
    {
        public required string Id { get; set; }
        public required string Username { get; set; }
        public required string Email { get; set; }
        public required string FullName { get; set; }
        public required string Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}