function onError(res, err) {
  let body = {
    status: "failed",
  };

  if (err) {
    body.message = err.message;
  } else {
    body.message = "欄位未填寫正確, 或無此ID";
  }

  res.status(400).send(body);
}

export default onError;
