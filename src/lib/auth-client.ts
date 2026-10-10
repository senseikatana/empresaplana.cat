import { createAuthClient } from "better-auth/client";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";
import { sentinelClient } from "@better-auth/infra/client";
import { passkeyClient } from "@better-auth/passkey/client";

export const authClient = createAuthClient({
	plugins: [
		twoFactorClient(),
		passkeyClient(),
		organizationClient(),
		sentinelClient(),
	],
});
