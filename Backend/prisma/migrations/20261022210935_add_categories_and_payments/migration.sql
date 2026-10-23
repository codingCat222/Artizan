BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[categories] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] NVARCHAR(max),
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [categories_status_df] DEFAULT 'Active',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [categories_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [categories_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categories_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[payments] (
    [id] NVARCHAR(1000) NOT NULL,
    [artisanId] NVARCHAR(1000) NOT NULL,
    [amount] INT NOT NULL,
    [gatewayFee] INT NOT NULL CONSTRAINT [payments_gatewayFee_df] DEFAULT 0,
    [period] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL CONSTRAINT [payments_status_df] DEFAULT 'Pending',
    [reference] NVARCHAR(1000) NOT NULL,
    [paidAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [payments_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [payments_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [payments_reference_key] UNIQUE NONCLUSTERED ([reference])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [payments_artisanId_idx] ON [dbo].[payments]([artisanId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [payments_period_idx] ON [dbo].[payments]([period]);

-- AddForeignKey
ALTER TABLE [dbo].[payments] ADD CONSTRAINT [payments_artisanId_fkey] FOREIGN KEY ([artisanId]) REFERENCES [dbo].[artisans]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
