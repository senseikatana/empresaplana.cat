-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(60) NOT NULL,
    "passkey" VARCHAR(128),
    "name" VARCHAR(60) NOT NULL,
    "fullName" VARCHAR(120) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'client',
    "totpSecret" VARCHAR(100),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorEnabled" BOOLEAN DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "appUserId" INTEGER,

    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verifications" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_two_factors" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT true,
    "failedVerificationCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "auth_two_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_passkeys" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aaguid" TEXT,

    CONSTRAINT "auth_passkeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "auth_organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_members" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_invitations" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inviterId" TEXT NOT NULL,

    CONSTRAINT "auth_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteRoute" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "routeId" VARCHAR(40) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentSearch" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "origin" VARCHAR(120) NOT NULL,
    "destination" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" VARCHAR(40) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "origin" VARCHAR(120) NOT NULL,
    "destination" VARCHAR(120) NOT NULL,
    "driverId" INTEGER,
    "color" VARCHAR(10) NOT NULL DEFAULT '#013990',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "path" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bus" (
    "id" SERIAL NOT NULL,
    "number" VARCHAR(20) NOT NULL,
    "plate" VARCHAR(20) NOT NULL,
    "company" VARCHAR(100) NOT NULL DEFAULT 'Empresa Plana',
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "routeId" VARCHAR(40),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "gps" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stop" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" VARCHAR(300) NOT NULL DEFAULT '',
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" SERIAL NOT NULL,
    "routeId" VARCHAR(40) NOT NULL,
    "departure" VARCHAR(10) NOT NULL,
    "arrival" VARCHAR(10) NOT NULL,
    "frequency" VARCHAR(30) NOT NULL DEFAULT '60 min',
    "days" VARCHAR(50) NOT NULL DEFAULT 'Lun–Dom',
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(30) NOT NULL DEFAULT '',
    "license" VARCHAR(30) NOT NULL DEFAULT '',
    "busNumber" VARCHAR(20),
    "routeId" VARCHAR(40),
    "shiftDays" VARCHAR(30),
    "shiftHours" VARCHAR(30),
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "desc" VARCHAR(1000) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "routeId" VARCHAR(40),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" VARCHAR(500) NOT NULL,
    "user" VARCHAR(100) NOT NULL DEFAULT 'Sistema',

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Budget" (
    "id" VARCHAR(40) NOT NULL,
    "userId" INTEGER NOT NULL,
    "clientName" VARCHAR(200) NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "company" VARCHAR(200),
    "reasonId" VARCHAR(60) NOT NULL,
    "description" VARCHAR(2000),
    "departureCity" VARCHAR(120) NOT NULL DEFAULT '',
    "departureDay" VARCHAR(12) NOT NULL DEFAULT '',
    "departureTime" VARCHAR(10) NOT NULL DEFAULT '',
    "arrivalCity" VARCHAR(120) NOT NULL DEFAULT '',
    "arrivalDay" VARCHAR(12) NOT NULL DEFAULT '',
    "arrivalTime" VARCHAR(10) NOT NULL DEFAULT '',
    "people" VARCHAR(10) NOT NULL DEFAULT '',
    "status" VARCHAR(20) NOT NULL DEFAULT 'received',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "lineId" VARCHAR(40) NOT NULL,
    "stop" VARCHAR(200) NOT NULL DEFAULT '',
    "action" VARCHAR(20) NOT NULL,
    "minutesLate" INTEGER,
    "comment" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "address" VARCHAR(300) NOT NULL,
    "city" VARCHAR(80) NOT NULL,
    "postalCode" VARCHAR(10) NOT NULL DEFAULT '',
    "phone" VARCHAR(30) NOT NULL DEFAULT '',
    "purpose" VARCHAR(300) NOT NULL DEFAULT '',
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" VARCHAR(20) NOT NULL,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" SERIAL NOT NULL,
    "conversationId" INTEGER NOT NULL,
    "senderId" INTEGER NOT NULL,
    "senderRole" VARCHAR(20) NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Line" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "pdfUrl" VARCHAR(500) NOT NULL,

    CONSTRAINT "Line_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchedulesOnLine" (
    "id" SERIAL NOT NULL,
    "lineId" INTEGER NOT NULL,
    "originTown" VARCHAR(120) NOT NULL,
    "destinationTown" VARCHAR(120) NOT NULL,
    "departureTime" VARCHAR(10) NOT NULL,
    "arrivalTime" VARCHAR(10) NOT NULL,
    "duration" VARCHAR(20) NOT NULL,
    "stopsJson" JSONB NOT NULL,

    CONSTRAINT "SchedulesOnLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineConnection" (
    "id" SERIAL NOT NULL,
    "fromLineId" INTEGER NOT NULL,
    "atStop" VARCHAR(200) NOT NULL,
    "toLineId" INTEGER NOT NULL,
    "waitMin" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LineConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RouteToStop" (
    "A" VARCHAR(40) NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RouteToStop_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_username_key" ON "auth_users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "auth_users_appUserId_key" ON "auth_users"("appUserId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_token_key" ON "auth_sessions"("token");

-- CreateIndex
CREATE INDEX "auth_sessions_userId_idx" ON "auth_sessions"("userId");

-- CreateIndex
CREATE INDEX "auth_accounts_userId_idx" ON "auth_accounts"("userId");

-- CreateIndex
CREATE INDEX "auth_verifications_identifier_idx" ON "auth_verifications"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "auth_two_factors_userId_key" ON "auth_two_factors"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_passkeys_credentialID_key" ON "auth_passkeys"("credentialID");

-- CreateIndex
CREATE INDEX "auth_passkeys_userId_idx" ON "auth_passkeys"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_organizations_slug_key" ON "auth_organizations"("slug");

-- CreateIndex
CREATE INDEX "auth_members_userId_idx" ON "auth_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "auth_members_organizationId_userId_key" ON "auth_members"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "auth_invitations_organizationId_idx" ON "auth_invitations"("organizationId");

-- CreateIndex
CREATE INDEX "auth_invitations_email_idx" ON "auth_invitations"("email");

-- CreateIndex
CREATE INDEX "FavoriteRoute_userId_idx" ON "FavoriteRoute"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteRoute_userId_routeId_key" ON "FavoriteRoute"("userId", "routeId");

-- CreateIndex
CREATE INDEX "RecentSearch_userId_idx" ON "RecentSearch"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Route_code_key" ON "Route"("code");

-- CreateIndex
CREATE INDEX "Route_status_idx" ON "Route"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_number_key" ON "Bus"("number");

-- CreateIndex
CREATE INDEX "Bus_status_idx" ON "Bus"("status");

-- CreateIndex
CREATE INDEX "Bus_routeId_idx" ON "Bus"("routeId");

-- CreateIndex
CREATE INDEX "Schedule_routeId_idx" ON "Schedule"("routeId");

-- CreateIndex
CREATE INDEX "Schedule_status_idx" ON "Schedule"("status");

-- CreateIndex
CREATE INDEX "Driver_status_idx" ON "Driver"("status");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Budget_userId_idx" ON "Budget"("userId");

-- CreateIndex
CREATE INDEX "Budget_status_idx" ON "Budget"("status");

-- CreateIndex
CREATE INDEX "Report_lineId_idx" ON "Report"("lineId");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "SchedulesOnLine_lineId_idx" ON "SchedulesOnLine"("lineId");

-- CreateIndex
CREATE INDEX "LineConnection_fromLineId_idx" ON "LineConnection"("fromLineId");

-- CreateIndex
CREATE INDEX "_RouteToStop_B_index" ON "_RouteToStop"("B");

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_two_factors" ADD CONSTRAINT "auth_two_factors_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_passkeys" ADD CONSTRAINT "auth_passkeys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_members" ADD CONSTRAINT "auth_members_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_members" ADD CONSTRAINT "auth_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "auth_organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_invitations" ADD CONSTRAINT "auth_invitations_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "auth_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteRoute" ADD CONSTRAINT "FavoriteRoute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentSearch" ADD CONSTRAINT "RecentSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchedulesOnLine" ADD CONSTRAINT "SchedulesOnLine_lineId_fkey" FOREIGN KEY ("lineId") REFERENCES "Line"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RouteToStop" ADD CONSTRAINT "_RouteToStop_A_fkey" FOREIGN KEY ("A") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RouteToStop" ADD CONSTRAINT "_RouteToStop_B_fkey" FOREIGN KEY ("B") REFERENCES "Stop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- App data is accessed through server-side Prisma; deny direct PostgREST access.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_two_factors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_passkeys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FavoriteRoute" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecentSearch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Route" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bus" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stop" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Driver" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Report" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Office" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConversationParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Line" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SchedulesOnLine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LineConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_RouteToStop" ENABLE ROW LEVEL SECURITY;
