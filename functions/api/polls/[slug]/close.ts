import { validateClosePollInput, LIMITS } from "../../../../src/lib/validation";
import {
  assertValidation,
  getParam,
  getTokenFromQuery,
  handleApi,
  jsonResponse,
  readJsonBody
} from "../../../_shared/http";
import { assertAdminToken, requirePoll, toPollDto } from "../../../_shared/store";
import type { RequestContext } from "../../../_shared/types";

export const onRequestPost = async (context: RequestContext): Promise<Response> =>
  handleApi(async () => {
    const slug = getParam(context, "slug");
    const poll = await requirePoll(context.env.DB, slug);
    await assertAdminToken(context.env, poll, getTokenFromQuery(context.request));

    const body = await readJsonBody(context.request, LIMITS.requestBodyBytes);
    const input = assertValidation(validateClosePollInput(body));

    await context.env.DB.prepare(
      `UPDATE polls
       SET is_closed = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE slug = ?
         AND admin_token_hash = ?`
    )
      .bind(input.isClosed ? 1 : 0, slug, poll.admin_token_hash)
      .run();

    return jsonResponse({
      poll: toPollDto({
        ...poll,
        is_closed: input.isClosed ? 1 : 0,
        updated_at: new Date().toISOString()
      })
    });
  });
