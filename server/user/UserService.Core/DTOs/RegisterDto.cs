using System.ComponentModel.DataAnnotations;

namespace UserService.Core.DTOs
{
    public class RegisterDto
    {
        [Required]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        public required string Username { get; set; }

        [Required]
        [EmailAddress]
        [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
        public required string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 100 characters")]
        public required string Password { get; set; }

        [StringLength(100, ErrorMessage = "Full name cannot exceed 100 characters")]
        public required string FullName { get; set; }
    }
}