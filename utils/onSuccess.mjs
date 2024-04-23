function onSuccess(res, data) {
  let body = {
    status: "success",
  };

  if (data !== undefined) {
    body.data = data;
  }

  res.status(200).send(body);
}

export default onSuccess;
