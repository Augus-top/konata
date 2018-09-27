exports.handleAsyncMethod = async (method, args) => {
  try {
    const result = await method(...args);
    return result;
  } catch (err) {
    console.log(err);
    return 'error';
  }
};

