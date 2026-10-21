BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[associations] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [code] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [members] INT NOT NULL CONSTRAINT [associations_members_df] DEFAULT 0,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [associations_status_df] DEFAULT 'Active',
    [contactEmail] NVARCHAR(1000) NOT NULL,
    [contactPhone] NVARCHAR(1000),
    [description] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [associations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [associations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [associations_code_key] UNIQUE NONCLUSTERED ([code])
);

-- CreateTable
CREATE TABLE [dbo].[staff_users] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [staff_users_status_df] DEFAULT 'Active',
    [associationId] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [staff_users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [staff_users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [staff_users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[artisans] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000),
    [category] NVARCHAR(1000) NOT NULL,
    [associationId] NVARCHAR(1000) NOT NULL,
    [town] NVARCHAR(1000) NOT NULL,
    [area] NVARCHAR(1000) NOT NULL,
    [phone] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [artisans_status_df] DEFAULT 'Pending',
    [verification] NVARCHAR(1000) NOT NULL CONSTRAINT [artisans_verification_df] DEFAULT 'Unverified',
    [businessName] NVARCHAR(1000) NOT NULL,
    [businessDescription] NVARCHAR(max),
    [whatsapp] NVARCHAR(1000),
    [businessAddress] NVARCHAR(1000),
    [shopNumber] NVARCHAR(1000),
    [dob] DATETIME2,
    [idType] NVARCHAR(1000),
    [idNumber] NVARCHAR(1000),
    [avatarInitials] NVARCHAR(1000) NOT NULL,
    [photo] NVARCHAR(1000),
    [mustChangePassword] BIT NOT NULL CONSTRAINT [artisans_mustChangePassword_df] DEFAULT 1,
    [createdBy] NVARCHAR(1000) NOT NULL,
    [verifiedBy] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [artisans_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [artisans_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [artisans_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[artisan_documents] (
    [id] NVARCHAR(1000) NOT NULL,
    [artisanId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [url] NVARCHAR(1000) NOT NULL,
    [review] NVARCHAR(1000) NOT NULL CONSTRAINT [artisan_documents_review_df] DEFAULT 'Under review',
    [uploaded] DATETIME2 NOT NULL CONSTRAINT [artisan_documents_uploaded_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [artisan_documents_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[refresh_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [tokenHash] NVARCHAR(1000) NOT NULL,
    [userType] NVARCHAR(1000) NOT NULL,
    [staffId] NVARCHAR(1000),
    [artisanId] NVARCHAR(1000),
    [expiresAt] DATETIME2 NOT NULL,
    [revokedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [refresh_tokens_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [userAgent] NVARCHAR(1000),
    [ipAddress] NVARCHAR(1000),
    CONSTRAINT [refresh_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [refresh_tokens_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

-- CreateTable
CREATE TABLE [dbo].[activation_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [tokenHash] NVARCHAR(1000) NOT NULL,
    [artisanId] NVARCHAR(1000) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [usedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [activation_tokens_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [activation_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [activation_tokens_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

-- CreateTable
CREATE TABLE [dbo].[password_reset_tokens] (
    [id] NVARCHAR(1000) NOT NULL,
    [tokenHash] NVARCHAR(1000) NOT NULL,
    [userType] NVARCHAR(1000) NOT NULL,
    [staffId] NVARCHAR(1000),
    [artisanId] NVARCHAR(1000),
    [expiresAt] DATETIME2 NOT NULL,
    [usedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [password_reset_tokens_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [password_reset_tokens_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [password_reset_tokens_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

-- AddForeignKey
ALTER TABLE [dbo].[staff_users] ADD CONSTRAINT [staff_users_associationId_fkey] FOREIGN KEY ([associationId]) REFERENCES [dbo].[associations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[artisans] ADD CONSTRAINT [artisans_associationId_fkey] FOREIGN KEY ([associationId]) REFERENCES [dbo].[associations]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[artisan_documents] ADD CONSTRAINT [artisan_documents_artisanId_fkey] FOREIGN KEY ([artisanId]) REFERENCES [dbo].[artisans]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[refresh_tokens] ADD CONSTRAINT [refresh_tokens_staffId_fkey] FOREIGN KEY ([staffId]) REFERENCES [dbo].[staff_users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[refresh_tokens] ADD CONSTRAINT [refresh_tokens_artisanId_fkey] FOREIGN KEY ([artisanId]) REFERENCES [dbo].[artisans]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[activation_tokens] ADD CONSTRAINT [activation_tokens_artisanId_fkey] FOREIGN KEY ([artisanId]) REFERENCES [dbo].[artisans]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[password_reset_tokens] ADD CONSTRAINT [password_reset_tokens_staffId_fkey] FOREIGN KEY ([staffId]) REFERENCES [dbo].[staff_users]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[password_reset_tokens] ADD CONSTRAINT [password_reset_tokens_artisanId_fkey] FOREIGN KEY ([artisanId]) REFERENCES [dbo].[artisans]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
