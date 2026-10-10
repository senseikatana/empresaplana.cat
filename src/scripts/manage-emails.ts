import { z } from "zod";
import {
	cancelScheduledEmail,
	getSentEmail,
	listSentEmails,
	shareSentEmail,
} from "@/lib/email";

const usage =
	"Usage: bun run email:manage list [limit] | get <id> | cancel <id> | share <id>";
const [command = "list", arg] = process.argv.slice(2);
const id = () => z.string().min(1, usage).parse(arg);

switch (command) {
	case "list": {
		const emails = await listSentEmails(
			z.coerce.number().int().min(1).max(100).default(20).parse(arg),
		);
		console.table(
			emails.map((e) => ({
				id: e.id,
				created: e.created_at,
				to: e.to.join(", "),
				subject: e.subject,
				event: e.last_event,
			})),
		);
		break;
	}
	case "get": {
		const { html: _html, ...email } = await getSentEmail(id());
		console.log(email);
		break;
	}
	case "cancel":
		console.log(await cancelScheduledEmail(id()));
		break;
	case "share":
		console.log(`Public link (48 h): ${await shareSentEmail(id())}`);
		break;
	default:
		throw new Error(usage);
}
