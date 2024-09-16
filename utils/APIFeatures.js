class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1A) FILTERING
    const queryObj = { ...this.queryString }; // in js if we normally assign queryObj = req.query
    //then it will just create a reference to the variable req.query
    //and therefore any changes done further in the latter will effect it,
    // therefor we will first destructure it using '...'
    //then wrapping the req.query inside {} to make it an object again
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);
    // console.log(req.query, queryObj);
    //1B.) ADVANCED FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    // console.log(JSON.parse(queryStr));
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      // console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination() {
    const page = this.queryString.page * 1 || 1;
    const limitVal = this.queryString.limit * 1 || 100;
    const skipVal = (page - 1) * limitVal;
    // page=2&limit=10, 1-10 = page 1, 11-20 = page 2 and so on
    this.query = this.query.skip(skipVal).limit(limitVal);
    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (skipVal >= numTours) throw new Error('this page does not exist');
    // }
    return this;
  }
}
module.exports = APIFeatures;
