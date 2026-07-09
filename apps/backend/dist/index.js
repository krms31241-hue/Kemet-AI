import { createHttpServer } from "./server.js";
import { env } from "./config/env.js";
const server = createHttpServer();
server.listen(env.PORT, () => {
    console.log(`🚀 Kemet AI Backend running on http://localhost:${env.PORT}`);
});
