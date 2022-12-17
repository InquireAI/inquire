import { createConnection } from "../../../../server/api/v1/controllers/connections/create-connection";
import { withApiKeyAuth } from "../../../../server/api/with-api-key-auth";

export default withApiKeyAuth(createConnection);
