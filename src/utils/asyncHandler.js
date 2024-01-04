const asyncHandler = (requestHandler) => {
  return function (req, res, next) {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => {
      next(err);
    });
  };
};

// const asyncHandler = (requestHandler) => (req, res, next) =>
//   Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));

export { asyncHandler };
















// const asyncHandler = (requestHandler) => {
//   // async function declare karte hain
//   return async function (req, res, next) {
//     try {
//       // requestHandler function ko await ke sath call karte hain
//       await requestHandler(req, res, next);
//     } catch (err) {
//       // Agar koi error aata hai toh use Express.js ke middleware ke next function ke zariye forward karte hain
//       next(err);
//     }
//   };
// };

// export { asyncHandler };
