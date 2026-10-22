BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[audit_logs] (
    [id] NVARCHAR(1000) NOT NULL,
    [actorId] NVARCHAR(1000),
    [actorName] NVARCHAR(1000) NOT NULL,
    [action] NVARCHAR(1000) NOT NULL,
    [target] NVARCHAR(500) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [audit_logs_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [audit_logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[platform_settings] (
    [id] NVARCHAR(1000) NOT NULL CONSTRAINT [platform_settings_id_df] DEFAULT 'singleton',
    [fee] INT NOT NULL CONSTRAINT [platform_settings_fee_df] DEFAULT 200,
    [dueDay] INT NOT NULL CONSTRAINT [platform_settings_dueDay_df] DEFAULT 5,
    [graceDays] INT NOT NULL CONSTRAINT [platform_settings_graceDays_df] DEFAULT 7,
    [reminderDays] NVARCHAR(1000) NOT NULL CONSTRAINT [platform_settings_reminderDays_df] DEFAULT '7, 3, 1',
    [adminsCanCreateStaff] BIT NOT NULL CONSTRAINT [platform_settings_adminsCanCreateStaff_df] DEFAULT 0,
    [revenueBasis] NVARCHAR(1000) NOT NULL CONSTRAINT [platform_settings_revenueBasis_df] DEFAULT 'gross',
    [gateway] NVARCHAR(1000) NOT NULL CONSTRAINT [platform_settings_gateway_df] DEFAULT 'Not yet selected',
    [emailProvider] NVARCHAR(1000) NOT NULL CONSTRAINT [platform_settings_emailProvider_df] DEFAULT 'Not yet selected',
    [supportEmail] NVARCHAR(1000) NOT NULL CONSTRAINT [platform_settings_supportEmail_df] DEFAULT 'support@aan-ogun.org',
    [updatedBy] NVARCHAR(1000),
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [platform_settings_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [audit_logs_createdAt_idx] ON [dbo].[audit_logs]([createdAt]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
