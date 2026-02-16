import { csrfSync } from "csrf-sync";


export const { csrfSynchronisedProtection } = csrfSync(
        {
            getTokenFromRequest: (req) => req.body["csrfToken"]
        }
);