CREATE SCHEMA [auth]

GO
/****** Object:  Table [dbo].[UserData]    Script Date: 30/01/2023 17:01:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserData](
	[UserID] [bigint] IDENTITY(1,1) NOT NULL,
	[Username] [varchar](100) NOT NULL,
	[Name] [varchar](100) NOT NULL,
	[Surname] [varchar](100) NOT NULL,
	[Password] [varchar](100) NOT NULL,
	[Group] [varchar](500) NOT NULL,
 CONSTRAINT [PK_UserData] PRIMARY KEY CLUSTERED 
(
	[UserID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[UserSettings]    Script Date: 30/01/2023 17:01:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[UserSettings](
	[UserID] [bigint] NOT NULL,
	[SettingName] [varchar](500) NOT NULL,
	[Value] [varchar](500) NULL
) ON [PRIMARY]
GO
/****** Object:  StoredProcedure [auth].[GetUsers]    Script Date: 30/01/2023 17:01:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		LukeScrewdriver
-- Create date: 30/01/2023
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [auth].[GetUsers]
	@Username VARCHAR(100) = NULL,
	@UserID BIGINT = NULL
AS
BEGIN
	SELECT *
    FROM [dbo].[UserData]
	WHERE(
	@Username IS NOT NULL AND  Username = @Username
	)
	OR
	(
	@Username IS NOT NULL AND  UserID = @UserID
	)
	OR 
	(@Username IS NULL AND @UserID IS NULL AND Username = Username AND UserID = UserID)
END
GO
/****** Object:  StoredProcedure [auth].[InsUser]    Script Date: 30/01/2023 17:01:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		LukeScrewdriver
-- Create date: 30/01/2023
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [auth].[InsUser]
	@Username VARCHAR(100),
	@Name VARCHAR(100),
	@Surname VARCHAR(100),
	@Password VARCHAR(100),
	@Group VARCHAR(500)
AS
BEGIN
	INSERT INTO [dbo].[UserData]
        ([Username],[Name],[Surname],[Password],[Group])
    VALUES (@Username, @Name, @Surname, @Password, @Group)
END
GO
/****** Object:  StoredProcedure [auth].[UpdPassword]    Script Date: 30/01/2023 17:01:18 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- =============================================
-- Author:		LukeScrewdriver
-- Create date: 19/01/2023
-- Description:	<Description,,>
-- =============================================
CREATE PROCEDURE [auth].[UpdPassword]
	@UserID bigint,
	@NewPassword varchar(10)
AS
BEGIN
	UPDATE [auth].[UserData]
	   SET [Password] = @newPassword
	 WHERE UserID = @userID
END
GO
