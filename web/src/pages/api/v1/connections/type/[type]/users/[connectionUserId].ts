import { getConnectionByTypeAndUser } from "../../../../../../../server/api/v1/controllers/connections/get-connection-by-type-and-user";
import { withApiKeyAuth } from "../../../../../../../server/api/with-api-key-auth";

export default withApiKeyAuth(getConnectionByTypeAndUser);
