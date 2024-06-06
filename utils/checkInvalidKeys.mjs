import ApiError from "../utils/ApiError.mjs";

function checkInvalidKeys(body, model) {
  const bodyKeys = Object.keys(body);
  const schemaKeys = Object.keys(model.schema.obj);
  const invalidKeys = bodyKeys.filter((key) => !schemaKeys.includes(key));
  if (invalidKeys.length) {
    throw new ApiError(400, `Invalid key(s): ${invalidKeys.join(", ")}`);
  }
}

export default checkInvalidKeys;
