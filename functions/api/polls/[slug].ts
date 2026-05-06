import { handleApi, jsonResponse, getParam } from "../../_shared/http";
import { buildPollPayload } from "../../_shared/store";
import type { RequestContext } from "../../_shared/types";

export const onRequestGet = async (context: RequestContext): Promise<Response> =>
  handleApi(async () => {
    const slug = getParam(context, "slug");
    const payload = await buildPollPayload(context.env.DB, slug);
    return jsonResponse(payload);
  });
