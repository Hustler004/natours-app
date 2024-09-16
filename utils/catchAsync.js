//used to catch errors and returns the function as a result so that when the router calls the respective function this will be executed
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
