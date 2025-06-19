USE master;
GO

-- Tạo database nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'UserServiceDb')
BEGIN
    CREATE DATABASE UserServiceDb;
END
GO

USE UserServiceDb;
GO

-- Tạo bảng Users
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        Id NVARCHAR(36) PRIMARY KEY,
        Username NVARCHAR(50) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        PasswordHash VARBINARY(MAX) NOT NULL,
        PasswordSalt VARBINARY(MAX) NOT NULL,
        FullName NVARCHAR(100),
        IsActive BIT DEFAULT 1,
        Role NVARCHAR(20) DEFAULT 'user',
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        UpdatedAt DATETIME2 DEFAULT GETUTCDATE()
    );

    -- Tạo indexes
    CREATE UNIQUE INDEX IX_Users_Username ON Users(Username);
    CREATE UNIQUE INDEX IX_Users_Email ON Users(Email);
END
GO

-- Tạo bảng RefreshTokens
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RefreshTokens')
BEGIN
    CREATE TABLE RefreshTokens (
        Id NVARCHAR(36) PRIMARY KEY,
        UserId NVARCHAR(36) NOT NULL,
        Token NVARCHAR(MAX) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
        RevokedAt DATETIME2 NULL,
        FOREIGN KEY (UserId) REFERENCES Users(Id)
    );

    -- Tạo index
    CREATE INDEX IX_RefreshTokens_UserId ON RefreshTokens(UserId);
END
GO

-- Thêm User admin mặc định nếu bảng trống (password sẽ được thay thế bởi hashed version)
IF NOT EXISTS (SELECT * FROM Users)
BEGIN
    -- Giá trị này sẽ được thay thế bởi code, đây chỉ là placeholder
    -- Mật khẩu thực sự sẽ được hash bởi code .NET
    INSERT INTO Users (Id, Username, Email, PasswordHash, PasswordSalt, FullName, Role)
    VALUES (
        NEWID(), 
        'admin', 
        'admin@example.com', 
        0x010203, -- placeholder
        0x010203, -- placeholder
        'Admin User',
        'admin'
    );
END
GO